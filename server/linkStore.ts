import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { ShortenedLink } from '../src/types';
import {
  classifyProtocol,
  parseAndValidateUrl,
  validateCustomAlias,
} from '../src/utils/urlValidator';

const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateShortCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export class LinkStore {
  private filePath: string;
  private links: Map<string, ShortenedLink> = new Map();

  constructor(filePath: string) {
    this.filePath = filePath;
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
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const payload = JSON.stringify(Array.from(this.links.values()), null, 2);
    fs.writeFileSync(this.filePath, payload, 'utf-8');
  }

  create(
    rawUrl: string,
    rawAlias?: string,
    currentOrigin?: string
  ): { ok: true; link: ShortenedLink } | { ok: false; status: number; error: string } {
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

    const record: ShortenedLink = {
      code,
      shortPath: `/s/${code}`,
      originalUrl: urlCheck.normalizedUrl,
      protocol: urlCheck.protocol,
      protocolLabel: urlCheck.protocolLabel || classifyProtocol(urlCheck.protocol),
      clicks: 0,
      createdAt: new Date().toISOString(),
      lastAccessedAt: null,
    };

    this.links.set(code.toLowerCase(), record);
    this.save();

    return { ok: true, link: record };
  }

  get(code: string): ShortenedLink | null {
    return this.links.get(code.toLowerCase()) ?? null;
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
}
