export type PageRoute = '/' | '/about' | '/privacy' | '/security';

export interface ShortenedLink {
  code: string;
  shortPath: string;
  originalUrl: string;
  protocol: string;
  protocolLabel: string;
  clicks: number;
  createdAt: string;
  lastAccessedAt: string | null;
}

export interface SafetyCheckItem {
  name: string;
  passed: boolean;
  detail: string;
}

export interface SafetyInspectionResult {
  valid: boolean;
  safe: boolean;
  protocol: string;
  protocolLabel: string;
  host: string;
  normalizedUrl: string | null;
  error: string | null;
  checks: SafetyCheckItem[];
}
