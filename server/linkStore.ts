import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { ShortenedLink } from '../src/types.ts';
import {
  classifyProtocol,
  parseAndValidateUrl,
  validateCustomAlias,
} from '../src/utils/urlValidator.ts';
import type { FirestoreLinksClient } from './firestoreClient.ts';

const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateShortCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export type CreateLinkResult =
  | { ok: true; link: ShortenedLink }
  | { ok: false; status: number; error: string };

export class LinkStore {
  private filePath: string;
  private links: Map<string, ShortenedLink> = new Map();
  private remote: FirestoreLinksClient | null;

  constructor(filePath: string, remote: FirestoreLinksClient | null = null) {
    this.filePath = filePath;
    this.remote = remote;
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw) as ShortenedLink[];
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && typeof item.code === 'string') {
              this.links.set(item.code.toLowerCase(), item);
            }
          }
        }
      }
    } catch {
      this.links = new Map();
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const payload = JSON.stringify(Array.from(this.links.values()), null, 2);
      fs.writeFileSync(this.filePath, payload, 'utf-8');
    } catch {
      // Keep in-memory store active if filesystem is read-only
    }
  }

  private buildRecord(
    code: string,
    normalizedUrl: string,
    protocol: string,
    protocolLabel: string
  ): ShortenedLink {
    return {
      code,
      shortPath: `/s/${code}`,
      originalUrl: normalizedUrl,
      protocol,
      protocolLabel: protocolLabel || classifyProtocol(protocol),
      clicks: 0,
      createdAt: new Date().toISOString(),
      lastAccessedAt: null,
    };
  }

  create(
    rawUrl: string,
    rawAlias?: string,
    currentOrigin?: string
  ): CreateLinkResult {
    const urlCheck = parseAndValidateUrl(rawUrl, currentOrigin);
    if (!urlCheck.valid || !urlCheck.normalizedUrl) {
      return {
        ok: false,
        status: 400,
        error: urlCheck.error || 'Invalid URL.',
      };
    }

    const aliasCheck = validateCustomAlias(rawAlias ?? '');
    if (!aliasCheck.valid) {
      return {
        ok: false,
        status: 400,
        error: aliasCheck.error || 'Invalid custom alias.',
      };
    }

    let code = aliasCheck.alias;
    if (code) {
      if (this.links.has(code.toLowerCase())) {
        return {
          ok: false,
          status: 409,
          error: `The custom alias "${code}" is already taken. Try a different alias.`,
        };
      }
    } else {
      let attempts = 0;
      do {
        code = generateShortCode(6);
        attempts += 1;
      } while (this.links.has(code.toLowerCase()) && attempts < 10);
    }

    const record = this.buildRecord(
      code,
      urlCheck.normalizedUrl,
      urlCheck.protocol,
      urlCheck.protocolLabel
    );

    this.links.set(code.toLowerCase(), record);
    this.save();

    return { ok: true, link: record };
  }

  async createAsync(
    rawUrl: string,
    rawAlias?: string,
    currentOrigin?: string
  ): Promise<CreateLinkResult> {
    if (!this.remote) {
      return this.create(rawUrl, rawAlias, currentOrigin);
    }

    const urlCheck = parseAndValidateUrl(rawUrl, currentOrigin);
    if (!urlCheck.valid || !urlCheck.normalizedUrl) {
      return {
        ok: false,
        status: 400,
        error: urlCheck.error || 'Invalid URL.',
      };
    }

    const aliasCheck = validateCustomAlias(rawAlias ?? '');
    if (!aliasCheck.valid) {
      return {
        ok: false,
        status: 400,
        error: aliasCheck.error || 'Invalid custom alias.',
      };
    }

    if (aliasCheck.alias) {
      const customCode = aliasCheck.alias;
      const draft = this.buildRecord(
        customCode,
        urlCheck.normalizedUrl,
        urlCheck.protocol,
        urlCheck.protocolLabel
      );

      try {
        const res = await this.remote.create(draft);
        if (res.ok === true) {
          this.links.set(customCode.toLowerCase(), res.link);
          this.save();
          return { ok: true, link: res.link };
        }
        if (res.conflict) {
          return {
            ok: false,
            status: 409,
            error: `The custom alias "${customCode}" is already taken. Try a different alias.`,
          };
        }
        console.error('Remote Firestore create error, falling back:', res.error);
      } catch (err) {
        console.error('Remote Firestore create exception, falling back:', err);
      }

      // Fallback to local if remote unavailable
      return this.create(rawUrl, rawAlias, currentOrigin);
    }

    // Random code generation with collision retries against Firestore
    for (let attempt = 0; attempt < 5; attempt++) {
      let code = generateShortCode(6);
      while (this.links.has(code.toLowerCase())) {
        code = generateShortCode(6);
      }
      const draft = this.buildRecord(
        code,
        urlCheck.normalizedUrl,
        urlCheck.protocol,
        urlCheck.protocolLabel
      );

      try {
        const res = await this.remote.create(draft);
        if (res.ok === true) {
          this.links.set(code.toLowerCase(), res.link);
          this.save();
          return { ok: true, link: res.link };
        }
        if (res.conflict) {
          continue;
        }
        console.error('Remote Firestore create error, falling back:', res.error);
        break;
      } catch (err) {
        console.error('Remote Firestore create exception, falling back:', err);
        break;
      }
    }

    return this.create(rawUrl, rawAlias, currentOrigin);
  }

  get(code: string): ShortenedLink | null {
    return this.links.get(code.toLowerCase()) ?? null;
  }

  async getAsync(code: string): Promise<ShortenedLink | null> {
    if (this.remote && /^[a-zA-Z0-9_-]{3,36}$/.test(code)) {
      try {
        const remoteLink = await this.remote.get(code);
        if (remoteLink) {
          this.links.set(remoteLink.code.toLowerCase(), remoteLink);
          return remoteLink;
        }
      } catch (err) {
        console.error('Remote Firestore get error, using local cache:', err);
      }
    }
    return this.get(code);
  }

  getMany(codes: string[]): ShortenedLink[] {
    const results: ShortenedLink[] = [];
    for (const c of codes) {
      const found = this.get(c.trim());
      if (found) {
        results.push(found);
      }
    }
    return results;
  }

  async getManyAsync(codes: string[]): Promise<ShortenedLink[]> {
    const cleaned = codes.map((c) => c.trim()).filter(Boolean).slice(0, 50);
    if (cleaned.length === 0) return [];

    if (this.remote) {
      try {
        const validIds = cleaned.filter((c) => /^[a-zA-Z0-9_-]{3,36}$/.test(c));
        const remoteLinks = await this.remote.getMany(validIds);
        const byKey = new Map<string, ShortenedLink>();
        for (const item of remoteLinks) {
          this.links.set(item.code.toLowerCase(), item);
          byKey.set(item.code.toLowerCase(), item);
        }
        const merged: ShortenedLink[] = [];
        for (const c of cleaned) {
          const hit = byKey.get(c.toLowerCase()) ?? this.get(c);
          if (hit) merged.push(hit);
        }
        return merged;
      } catch (err) {
        console.error('Remote Firestore getMany error, using local cache:', err);
      }
    }

    return this.getMany(cleaned);
  }

  recordClick(code: string): ShortenedLink | null {
    const key = code.toLowerCase();
    const record = this.links.get(key);
    if (!record) return null;

    const updated: ShortenedLink = {
      ...record,
      clicks: record.clicks + 1,
      lastAccessedAt: new Date().toISOString(),
    };
    this.links.set(key, updated);
    this.save();
    return updated;
  }

  async recordClickAsync(code: string): Promise<ShortenedLink | null> {
    if (!/^[a-zA-Z0-9_-]{3,36}$/.test(code)) {
      return this.recordClick(code);
    }

    if (this.remote) {
      try {
        const existing = await this.getAsync(code);
        if (!existing) {
          return this.recordClick(code);
        }

        const updatedMeta = await this.remote.incrementClick(existing.code);
        if (updatedMeta) {
          const updated: ShortenedLink = {
            ...existing,
            clicks: updatedMeta.clicks,
            lastAccessedAt: updatedMeta.lastAccessedAt,
          };
          this.links.set(existing.code.toLowerCase(), updated);
          this.save();
          return updated;
        }
      } catch (err) {
        console.error('Remote Firestore recordClick error, falling back:', err);
      }
    }

    return this.recordClick(code);
  }
}
