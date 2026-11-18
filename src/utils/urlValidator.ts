import type { SafetyCheckItem, SafetyInspectionResult } from '../types.ts';

export const MAX_URL_LENGTH = 4096;

const BLOCKED_SCHEMES = new Set([
  'javascript',
  'data',
  'vbscript',
  'jscript',
  'livescript',
  'mocha',
  'file',
]);

const RESERVED_ALIASES = new Set([
  'api',
  'about',
  'privacy',
  'security',
  's',
  'assets',
  'src',
  'health',
  'favicon',
  'robots',
  'sitemap',
]);

export interface ParsedUrlResult {
  valid: boolean;
  normalizedUrl: string | null;
  protocol: string;
  protocolLabel: string;
  host: string;
  error: string | null;
}

export interface AliasValidationResult {
  valid: boolean;
  alias: string | null;
  error: string | null;
}

export function classifyProtocol(protocol: string): string {
  const clean = protocol.toLowerCase().replace(/:$/, '');
  switch (clean) {
    case 'https':
      return 'Web (HTTPS)';
    case 'http':
      return 'Web (HTTP)';
    case 'mailto':
      return 'Email (mailto)';
    case 'tel':
      return 'Phone (tel)';
    case 'sms':
      return 'Messaging (sms)';
    case 'ftp':
    case 'sftp':
      return 'File Transfer';
    case 'ws':
    case 'wss':
      return 'WebSocket';
    case 'magnet':
      return 'Magnet Link';
    case 'ssh':
      return 'SSH Endpoint';
    default:
      return `App Deep Link (${clean})`;
  }
}

export function parseAndValidateUrl(
  rawInput: string,
  currentOrigin?: string
): ParsedUrlResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      normalizedUrl: null,
      protocol: '',
      protocolLabel: '',
      host: '',
      error: 'Enter a URL, domain, email, phone number, or deep link to shorten.',
    };
  }

  if (trimmed.length > MAX_URL_LENGTH) {
    return {
      valid: false,
      normalizedUrl: null,
      protocol: '',
      protocolLabel: '',
      host: '',
      error: `URL exceeds the ${MAX_URL_LENGTH}-character limit.`,
    };
  }

  if (/[\r\n\t\0]/.test(trimmed)) {
    return {
      valid: false,
      normalizedUrl: null,
      protocol: '',
      protocolLabel: '',
      host: '',
      error: 'URL cannot contain line breaks or control characters.',
    };
  }

  // Detect explicit RFC 3986 scheme prefix (e.g. https:, mailto:, tel:, magnet:, vscode:)
  // Note: distinguish scheme from host:port like localhost:3000 or example.com:8080/path
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/);
  let candidate = trimmed;

  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    const rest = schemeMatch[2];

    if (BLOCKED_SCHEMES.has(scheme)) {
      return {
        valid: false,
        normalizedUrl: null,
        protocol: scheme,
        protocolLabel: 'Blocked Scheme',
        host: '',
        error: `The "${scheme}:" protocol is blocked for security reasons.`,
      };
    }

    // If it looks like host:port (digits right after colon and no //), treat as bare domain
    if (/^\d+(?:\/|$|\?|#)/.test(rest)) {
      const lower = trimmed.toLowerCase();
      const isLocal =
        lower.startsWith('localhost:') ||
        lower.startsWith('127.0.0.1:') ||
        lower.startsWith('0.0.0.0:');
      candidate = `${isLocal ? 'http' : 'https'}://${trimmed}`;
    }
  } else {
    // Normalize bare email addresses (e.g. team@example.com) to mailto:
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      candidate = `mailto:${trimmed}`;
    } else {
      // No scheme provided — normalize bare domains and localhost
      const hostSegment = trimmed.split(/[/?#]/)[0];
      if (/\s/.test(hostSegment)) {
        return {
          valid: false,
          normalizedUrl: null,
          protocol: '',
          protocolLabel: '',
          host: '',
          error: 'Domain names cannot contain spaces.',
        };
      }

      const lower = trimmed.toLowerCase();
      const isLocal =
        lower === 'localhost' ||
        lower.startsWith('localhost/') ||
        lower.startsWith('127.0.0.1') ||
        lower.startsWith('[::1]');
      candidate = `${isLocal ? 'http' : 'https'}://${trimmed}`;
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      valid: false,
      normalizedUrl: null,
      protocol: '',
      protocolLabel: '',
      host: '',
      error: 'Enter a valid URL (for example, https://example.com or mailto:team@example.com).',
    };
  }

  const cleanProtocol = parsed.protocol.replace(/:$/, '').toLowerCase();
  if (BLOCKED_SCHEMES.has(cleanProtocol)) {
    return {
      valid: false,
      normalizedUrl: null,
      protocol: cleanProtocol,
      protocolLabel: 'Blocked Scheme',
      host: '',
      error: `The "${cleanProtocol}:" protocol is blocked for security reasons.`,
    };
  }

  // Validate HTTP(S) and WebSocket hosts have a real hostname (with a dot, localhost, or IPv6)
  if (
    cleanProtocol === 'http' ||
    cleanProtocol === 'https' ||
    cleanProtocol === 'ws' ||
    cleanProtocol === 'wss' ||
    cleanProtocol === 'ftp' ||
    cleanProtocol === 'sftp'
  ) {
    const hostname = parsed.hostname;
    const isIpOrLocal =
      hostname === 'localhost' ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) ||
      hostname.startsWith('[');
    if (!hostname || (!isIpOrLocal && !hostname.includes('.'))) {
      return {
        valid: false,
        normalizedUrl: null,
        protocol: cleanProtocol,
        protocolLabel: classifyProtocol(cleanProtocol),
        host: hostname,
        error: 'Enter a complete domain name (such as example.com) or valid IP address.',
      };
    }
  }

  // Validate non-empty opaque payload for mailto, tel, sms, magnet, custom deep links
  if (cleanProtocol === 'mailto') {
    const address = parsed.pathname;
    if (!address || !address.includes('@')) {
      return {
        valid: false,
        normalizedUrl: null,
        protocol: cleanProtocol,
        protocolLabel: classifyProtocol(cleanProtocol),
        host: '',
        error: 'Enter a valid email address after mailto: (e.g., mailto:hello@example.com).',
      };
    }
  }

  if (cleanProtocol === 'tel' || cleanProtocol === 'sms') {
    const target = parsed.pathname.trim();
    if (!target || target.length < 3) {
      return {
        valid: false,
        normalizedUrl: null,
        protocol: cleanProtocol,
        protocolLabel: classifyProtocol(cleanProtocol),
        host: '',
        error: `Enter a valid phone number after ${cleanProtocol}: (e.g., ${cleanProtocol}:+14155550100).`,
      };
    }
  }

  // Prevent redirect loops pointing back to this service's /s/* routes
  if (currentOrigin) {
    try {
      const originUrl = new URL(currentOrigin);
      if (
        parsed.origin === originUrl.origin &&
        parsed.pathname.startsWith('/s/')
      ) {
        return {
          valid: false,
          normalizedUrl: null,
          protocol: cleanProtocol,
          protocolLabel: classifyProtocol(cleanProtocol),
          host: parsed.host,
          error: 'Shortening an existing PrismLink short URL is blocked to prevent redirect loops.',
        };
      }
    } catch {
      // Ignore malformed currentOrigin
    }
  }

  return {
    valid: true,
    normalizedUrl: parsed.href,
    protocol: cleanProtocol,
    protocolLabel: classifyProtocol(cleanProtocol),
    host: parsed.host || parsed.pathname.split(/[/?#]/)[0] || cleanProtocol,
    error: null,
  };
}

export function validateCustomAlias(rawAlias: string): AliasValidationResult {
  const trimmed = rawAlias.trim();
  if (!trimmed) {
    return { valid: true, alias: null, error: null };
  }

  if (trimmed.length < 3 || trimmed.length > 36) {
    return {
      valid: false,
      alias: null,
      error: 'Custom alias must be between 3 and 36 characters.',
    };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return {
      valid: false,
      alias: null,
      error: 'Custom alias may only contain letters, numbers, hyphens, and underscores.',
    };
  }

  if (RESERVED_ALIASES.has(trimmed.toLowerCase())) {
    return {
      valid: false,
      alias: null,
      error: `"${trimmed}" is a reserved route name. Choose another alias.`,
    };
  }

  return { valid: true, alias: trimmed, error: null };
}

export function inspectUrlSafety(
  rawInput: string,
  currentOrigin?: string
): SafetyInspectionResult {
  const parsed = parseAndValidateUrl(rawInput, currentOrigin);
  const trimmed = rawInput.trim();
  const checks: SafetyCheckItem[] = [];

  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  const rawScheme = schemeMatch ? schemeMatch[1].toLowerCase() : parsed.protocol || 'none';
  const isBlockedScheme = BLOCKED_SCHEMES.has(rawScheme);

  checks.push({
    name: 'Executable Scheme Filter',
    passed: !isBlockedScheme && parsed.valid,
    detail: isBlockedScheme
      ? `Blocked dangerous "${rawScheme}:" execution protocol.`
      : parsed.valid
        ? `Allowed safe "${parsed.protocol}:" protocol.`
        : 'Could not verify a valid URL protocol.',
  });

  const hasControlChars = /[\r\n\t\0]/.test(trimmed);
  checks.push({
    name: 'Control Character Sanitization',
    passed: !hasControlChars && trimmed.length > 0 && trimmed.length <= MAX_URL_LENGTH,
    detail: hasControlChars
      ? 'Detected disallowed control or newline characters.'
      : trimmed.length > MAX_URL_LENGTH
        ? `Input exceeds ${MAX_URL_LENGTH} characters.`
        : 'No header-injection or control characters detected.',
  });

  const isLoop = Boolean(
    parsed.error && parsed.error.toLowerCase().includes('redirect loop')
  );
  checks.push({
    name: 'Redirect Loop Prevention',
    passed: !isLoop && parsed.valid,
    detail: isLoop
      ? 'Self-referential shortener loop detected and blocked.'
      : parsed.valid
        ? 'Destination points outside shortener redirect routes.'
        : 'Requires a valid destination to evaluate routing.',
  });

  const hasCredentials = Boolean(
    parsed.normalizedUrl && /^https?:\/\/[^/]*@/.test(parsed.normalizedUrl)
  );
  checks.push({
    name: 'Embedded Credential Check',
    passed: parsed.valid && !hasCredentials,
    detail: hasCredentials
      ? 'URL embeds user:pass credentials in authority segment (phishing risk).'
      : parsed.valid
        ? 'No obfuscated userinfo credentials in URL authority.'
        : 'Requires a valid destination to inspect authority segment.',
  });

  return {
    valid: parsed.valid,
    safe: parsed.valid && !isBlockedScheme && !hasControlChars && !isLoop && !hasCredentials,
    protocol: parsed.protocol || rawScheme,
    protocolLabel: parsed.protocolLabel || 'Unverified',
    host: parsed.host,
    normalizedUrl: parsed.normalizedUrl,
    error: parsed.error,
    checks,
  };
}
