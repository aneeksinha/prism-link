import fs from 'node:fs';
import path from 'node:path';
import type { ShortenedLink } from '../src/types.ts';

interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId?: string;
}

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  timestampValue?: string;
  nullValue?: null;
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

function loadFirebaseConfig(): FirebaseConfig | null {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as FirebaseConfig;
    if (!raw?.projectId || !raw?.apiKey || raw.projectId === 'remixed-project-id') {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

function parseLinkDocument(doc: FirestoreDocument): ShortenedLink | null {
  const f = doc.fields;
  if (!f || !f.code?.stringValue || !f.originalUrl?.stringValue) return null;

  const code = f.code.stringValue;
  const clicksRaw = f.clicks?.integerValue ?? '0';
  const clicks = Number.parseInt(clicksRaw, 10);

  return {
    code,
    shortPath: f.shortPath?.stringValue || `/s/${code}`,
    originalUrl: f.originalUrl.stringValue,
    protocol: f.protocol?.stringValue || 'https',
    protocolLabel: f.protocolLabel?.stringValue || 'Web (HTTPS)',
    clicks: Number.isFinite(clicks) ? clicks : 0,
    createdAt: f.createdAt?.timestampValue || f.createdAt?.stringValue || new Date().toISOString(),
    lastAccessedAt:
      f.lastAccessedAt?.timestampValue || f.lastAccessedAt?.stringValue || null,
  };
}

export class FirestoreLinksClient {
  private config: FirebaseConfig;
  private dbId: string;
  private baseUrl: string;
  private docPathPrefix: string;

  constructor(config: FirebaseConfig) {
    this.config = config;
    this.dbId = config.firestoreDatabaseId || '(default)';
    this.docPathPrefix = `projects/${config.projectId}/databases/${this.dbId}/documents/links`;
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      config.projectId
    )}/databases/${encodeURIComponent(this.dbId)}/documents`;
  }

  static fromEnvironment(): FirestoreLinksClient | null {
    const config = loadFirebaseConfig();
    if (!config) return null;
    return new FirestoreLinksClient(config);
  }

  private docName(code: string): string {
    return `${this.docPathPrefix}/${code.toLowerCase()}`;
  }

  async get(code: string): Promise<ShortenedLink | null> {
    const id = code.toLowerCase();
    const url = `${this.baseUrl}/links/${encodeURIComponent(id)}?key=${encodeURIComponent(
      this.config.apiKey
    )}`;
    const res = await fetch(url, { method: 'GET' });
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Firestore GET failed (${res.status}): ${text}`);
    }
    const doc = (await res.json()) as FirestoreDocument;
    return parseLinkDocument(doc);
  }

  async getMany(codes: string[]): Promise<ShortenedLink[]> {
    const uniqueIds = Array.from(
      new Set(codes.map((c) => c.trim().toLowerCase()).filter(Boolean))
    ).slice(0, 50);

    if (uniqueIds.length === 0) return [];

    const url = `${this.baseUrl}:batchGet?key=${encodeURIComponent(this.config.apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documents: uniqueIds.map((id) => `${this.docPathPrefix}/${id}`),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Firestore batchGet failed (${res.status}): ${text}`);
    }

    const items = (await res.json()) as Array<{ found?: FirestoreDocument }>;
    const byId = new Map<string, ShortenedLink>();
    for (const entry of items) {
      if (entry.found) {
        const parsed = parseLinkDocument(entry.found);
        if (parsed) {
          byId.set(parsed.code.toLowerCase(), parsed);
        }
      }
    }

    const results: ShortenedLink[] = [];
    for (const id of uniqueIds) {
      const match = byId.get(id);
      if (match) results.push(match);
    }
    return results;
  }

  async create(
    link: ShortenedLink
  ): Promise<{ ok: true; link: ShortenedLink } | { ok: false; conflict: boolean; error: string }> {
    const url = `${this.baseUrl}:commit?key=${encodeURIComponent(this.config.apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: this.docName(link.code),
              fields: {
                code: { stringValue: link.code },
                shortPath: { stringValue: link.shortPath },
                originalUrl: { stringValue: link.originalUrl },
                protocol: { stringValue: link.protocol },
                protocolLabel: { stringValue: link.protocolLabel },
                clicks: { integerValue: '0' },
                lastAccessedAt: { nullValue: null },
              },
            },
            updateTransforms: [
              {
                fieldPath: 'createdAt',
                setToServerValue: 'REQUEST_TIME',
              },
            ],
            currentDocument: {
              exists: false,
            },
          },
        ],
      }),
    });

    if (res.status === 409) {
      return { ok: false, conflict: true, error: 'Short code already exists.' };
    }

    if (!res.ok) {
      const text = await res.text();
      const isConflict =
        res.status === 400 &&
        (text.includes('ALREADY_EXISTS') || text.includes('FAILED_PRECONDITION'));
      return {
        ok: false,
        conflict: isConflict,
        error: `Firestore create failed (${res.status}): ${text}`,
      };
    }

    const data = (await res.json()) as {
      commitTime?: string;
      writeResults?: Array<{ transformResults?: FirestoreValue[] }>;
    };
    const serverCreatedAt =
      data.writeResults?.[0]?.transformResults?.[0]?.timestampValue ||
      data.commitTime ||
      link.createdAt;

    return {
      ok: true,
      link: {
        ...link,
        createdAt: serverCreatedAt,
      },
    };
  }

  async incrementClick(
    code: string
  ): Promise<{ clicks: number; lastAccessedAt: string } | null> {
    const url = `${this.baseUrl}:commit?key=${encodeURIComponent(this.config.apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        writes: [
          {
            transform: {
              document: this.docName(code),
              fieldTransforms: [
                {
                  fieldPath: 'clicks',
                  increment: { integerValue: '1' },
                },
                {
                  fieldPath: 'lastAccessedAt',
                  setToServerValue: 'REQUEST_TIME',
                },
              ],
            },
            currentDocument: {
              exists: true,
            },
          },
        ],
      }),
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 400 && text.includes('NOT_FOUND')) return null;
      throw new Error(`Firestore incrementClick failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as {
      commitTime?: string;
      writeResults?: Array<{ transformResults?: FirestoreValue[] }>;
    };
    const results = data.writeResults?.[0]?.transformResults ?? [];
    const clicks = Number.parseInt(results[0]?.integerValue ?? '1', 10);
    const lastAccessedAt =
      results[1]?.timestampValue || data.commitTime || new Date().toISOString();

    return {
      clicks: Number.isFinite(clicks) ? clicks : 1,
      lastAccessedAt,
    };
  }
}
