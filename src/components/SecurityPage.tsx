import { useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, Search, ShieldCheck, ShieldX } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { PageRoute, SafetyInspectionResult, ShortenedLink } from '../types';
import { inspectUrlSafety } from '../utils/urlValidator';

interface SecurityPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function SecurityPage({ onNavigate }: SecurityPageProps) {
  const [inspectInput, setInspectInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SafetyInspectionResult | null>(null);
  const [matchedLink, setMatchedLink] = useState<ShortenedLink | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const runInspection = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setInputError('Enter a URL or a PrismLink short code (e.g., /s/abc123) to inspect.');
      setResult(null);
      setMatchedLink(null);
      return;
    }

    setInputError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          inspection: SafetyInspectionResult;
          matchedShortLink: ShortenedLink | null;
        };
        setResult(data.inspection);
        setMatchedLink(data.matchedShortLink);
      } else {
        setResult(inspectUrlSafety(trimmed, window.location.origin));
        setMatchedLink(null);
      }
    } catch {
      setResult(inspectUrlSafety(trimmed, window.location.origin));
      setMatchedLink(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    runInspection(inspectInput);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-labelledby="security-heading"
      className="mx-auto max-w-3xl py-8 sm:py-12"
    >
      <div className="mb-8">
        <p className="text-xs font-medium text-slate-400">
          Protocol Sanitization · Redirect Integrity
        </p>
        <h1
          id="security-heading"
          className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#f5f4f0] sm:text-4xl [text-wrap:balance]"
        >
          Security &amp; Link Safety
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-300">
          Every destination submitted to PrismLink passes strict protocol filtering, control-character sanitization, and loop prevention before a short link is created.
        </p>
      </div>

      {/* Interactive Link Safety Inspector */}
      <div className="liquid-glass rounded-3xl p-5 sm:p-7">
        <h2 className="font-display text-xl font-semibold text-[#f5f4f0]">
          Link Safety Inspector
        </h2>
        <p className="mt-1.5 text-sm text-slate-300">
          Paste any URL or PrismLink short code to preview its normalized destination and security checks before opening.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-4">
          <label htmlFor="security-inspect-input" className="sr-only">
            URL or short code to inspect
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                id="security-inspect-input"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={inspectInput}
                onChange={(e) => {
                  setInspectInput(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder="https://example.com, javascript:alert(1), or /s/code"
                className="liquid-input min-h-[46px] w-full rounded-2xl pl-10 pr-4 text-sm text-[#f5f4f0] placeholder:text-slate-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="liquid-btn-primary inline-flex min-h-[46px] items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {loading ? 'Inspecting...' : 'Inspect Link'}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400">
            <span>Test samples:</span>
            <button
              type="button"
              onClick={() => {
                const sample = 'https://developer.mozilla.org/en-US/docs/Web/Security';
                setInspectInput(sample);
                runInspection(sample);
              }}
              className="font-medium text-amber-300 underline decoration-amber-300/35 underline-offset-4 hover:text-amber-200 cursor-pointer"
            >
              Safe HTTPS URL
            </button>
            <button
              type="button"
              onClick={() => {
                const sample = 'javascript:alert(1)';
                setInspectInput(sample);
                runInspection(sample);
              }}
              className="font-medium text-amber-300 underline decoration-amber-300/35 underline-offset-4 hover:text-amber-200 cursor-pointer"
            >
              Blocked XSS Scheme
            </button>
            <button
              type="button"
              onClick={() => {
                const sample = 'https://user:pass@example.com/verify';
                setInspectInput(sample);
                runInspection(sample);
              }}
              className="font-medium text-amber-300 underline decoration-amber-300/35 underline-offset-4 hover:text-amber-200 cursor-pointer"
            >
              Embedded Credentials
            </button>
          </div>

          {inputError && (
            <p role="alert" className="mt-3 text-sm font-medium text-rose-300">
              {inputError}
            </p>
          )}
        </form>

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={`${result.normalizedUrl ?? inspectInput}-${result.safe}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 border-t border-white/10 pt-5"
              data-testid="inspection-result"
            >
              <div className="flex items-start gap-3">
                {result.safe ? (
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                ) : result.valid ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                ) : (
                  <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-sm font-semibold">
                    <span
                      className={
                        result.safe
                          ? 'text-emerald-300'
                          : result.valid
                            ? 'text-amber-300'
                            : 'text-rose-300'
                      }
                    >
                      {result.safe
                        ? 'Safe to shorten and redirect'
                        : result.valid
                          ? 'Caution advised'
                          : 'Blocked by security policy'}
                    </span>
                    <span aria-hidden="true" className="text-slate-500">·</span>
                    <span className="font-normal text-slate-300">
                      {result.protocolLabel}
                    </span>
                  </div>

                  {matchedLink && (
                    <p className="mt-1 text-xs text-slate-300">
                      Resolved short code <code className="font-mono text-amber-200">/s/{matchedLink.code}</code> ({matchedLink.clicks} total clicks)
                    </p>
                  )}

                  {result.normalizedUrl ? (
                    <p className="mt-1.5 break-all font-mono text-xs text-slate-300">
                      Destination: {result.normalizedUrl}
                    </p>
                  ) : result.error ? (
                    <p className="mt-1.5 text-xs text-rose-300">{result.error}</p>
                  ) : null}
                </div>
              </div>

              <ul className="mt-4 space-y-2 border-t border-white/10 pt-3">
                {result.checks.map((check) => (
                  <li key={check.name} className="flex items-start gap-2.5 text-xs">
                    {check.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    ) : (
                      <ShieldX className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    )}
                    <div>
                      <span className="font-semibold text-[#f5f4f0]">{check.name}: </span>
                      <span className="text-slate-300">{check.detail}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Security Architecture Details */}
      <div className="mt-6 space-y-4">
        <article className="liquid-glass-subtle rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold text-[#f5f4f0]">
            01. Dangerous Protocol Rejection
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            PrismLink blocks script-executing and local-file schemes (<code className="font-mono text-xs text-amber-200">javascript:</code>, <code className="font-mono text-xs text-amber-200">data:</code>, <code className="font-mono text-xs text-amber-200">vbscript:</code>, <code className="font-mono text-xs text-amber-200">file:</code>) on both the client and server so malicious payloads can never be masked behind a short URL.
          </p>
        </article>

        <article className="liquid-glass-subtle rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold text-[#f5f4f0]">
            02. Redirect Integrity &amp; No-Cache Headers
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            All HTTP redirects send <code className="font-mono text-xs text-amber-200">Cache-Control: no-store</code> and <code className="font-mono text-xs text-amber-200">X-Content-Type-Options: nosniff</code>, while self-referential <code className="font-mono text-xs text-amber-200">/s/*</code> destinations are rejected to prevent infinite redirect chains.
          </p>
        </article>

        <article className="liquid-glass-subtle rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold text-[#f5f4f0]">
            03. Cryptographically Random Short Codes
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Generated codes use Node&rsquo;s <code className="font-mono text-xs text-amber-200">crypto.randomBytes</code> over a high-entropy unambiguous alphabet (omitting visually similar characters like <code className="font-mono text-xs text-amber-200">0</code>, <code className="font-mono text-xs text-amber-200">O</code>, <code className="font-mono text-xs text-amber-200">1</code>, and <code className="font-mono text-xs text-amber-200">l</code>) to prevent sequential enumeration.
          </p>
        </article>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 px-1">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="liquid-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold cursor-pointer"
        >
          Back to Shortener
        </button>
        <a
          href="/privacy"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/privacy');
          }}
          className="text-sm font-semibold text-amber-300 underline decoration-amber-300/35 underline-offset-4 hover:text-amber-200"
        >
          Read Privacy Policy
        </a>
      </div>
    </motion.section>
  );
}
