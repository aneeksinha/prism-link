import { useMemo, useState, type FormEvent, type RefObject } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Link2,
  QrCode,
  SlidersHorizontal,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ShortenedLink } from '../types';
import { parseAndValidateUrl } from '../utils/urlValidator';

interface ShortenerWorkspaceProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onLinkCreated: (link: ShortenedLink) => void;
  onOpenQr: (link: ShortenedLink) => void;
}

const SAMPLE_URLS = [
  { label: 'Web Article', value: 'https://developer.mozilla.org/en-US/docs/Web/API' },
  { label: 'Email Link', value: 'mailto:hello@example.com?subject=Project%20Inquiry' },
  { label: 'Phone URI', value: 'tel:+14155550100' },
  { label: 'App Deep Link', value: 'vscode://file/workspace/README.md' },
];

export function ShortenerWorkspace({
  inputRef,
  onLinkCreated,
  onOpenQr,
}: ShortenerWorkspaceProps) {
  const [urlInput, setUrlInput] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [latestLink, setLatestLink] = useState<ShortenedLink | null>(null);
  const [copied, setCopied] = useState(false);

  const liveProtocolHint = useMemo(() => {
    if (!urlInput.trim()) return null;
    const res = parseAndValidateUrl(urlInput, window.location.origin);
    if (!res.valid) return null;
    return res.protocolLabel;
  }, [urlInput]);

  const latestShortUrl = latestLink
    ? `${window.location.origin}${latestLink.shortPath}`
    : '';

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const temp = document.createElement('input');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const clientCheck = parseAndValidateUrl(urlInput, window.location.origin);
    if (!clientCheck.valid) {
      setErrorMsg(clientCheck.error || 'Enter a valid URL to shorten.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput,
          alias: customAlias.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as {
        link?: ShortenedLink;
        error?: string;
      };

      if (!response.ok || !payload.link) {
        setErrorMsg(payload.error || 'Unable to shorten this URL right now.');
        return;
      }

      setLatestLink(payload.link);
      onLinkCreated(payload.link);
      setUrlInput('');
      setCustomAlias('');
      setCopied(false);
    } catch {
      setErrorMsg('Network error while connecting to the shortener service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="hero-heading" className="pt-8 pb-8 sm:pt-14 sm:pb-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1
          id="hero-heading"
          className="font-display font-semibold tracking-[-0.025em] text-[#f5f4f0] text-[clamp(2.25rem,4.8vw,3.75rem)] leading-[1.06] [text-wrap:balance]"
        >
          Shorten any link with zero friction.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Turn web URLs, email links, phone numbers, magnet links, and app deep links into clean short URLs. No account or sign-up required.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mt-8 max-w-3xl"
      >
        <div className="liquid-glass rounded-3xl p-4 sm:p-6">
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="url-input" className="sr-only">
              Destination URL
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Link2
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  ref={inputRef}
                  id="url-input"
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Paste any URL, email, phone, or deep link"
                  className="liquid-input min-h-[48px] w-full rounded-2xl pl-10 pr-4 text-sm text-[#f5f4f0] placeholder:text-slate-500 sm:text-base"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="liquid-btn-primary inline-flex min-h-[48px] items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              >
                {isSubmitting ? 'Shortening...' : 'Shorten URL'}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
              <button
                type="button"
                onClick={() => setShowOptions((prev) => !prev)}
                aria-expanded={showOptions}
                aria-controls="alias-options-panel"
                className="liquid-btn-glass inline-flex min-h-[36px] items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 cursor-pointer"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-amber-300" />
                {showOptions ? 'Hide custom alias' : 'Add custom alias'}
              </button>

              <div className="text-xs text-slate-400">
                {liveProtocolHint ? (
                  <span>
                    Detected format: <strong className="font-medium text-amber-300">{liveProtocolHint}</strong>
                  </span>
                ) : (
                  <span>Web, email, phone, magnet &amp; deep links</span>
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showOptions && (
                <motion.div
                  id="alias-options-panel"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-3 border-t border-white/10 pt-3"
                >
                  <label
                    htmlFor="custom-alias-input"
                    className="block text-xs font-medium text-slate-300"
                  >
                    Custom Alias (optional, 3–36 letters, numbers, hyphens, or underscores)
                  </label>
                  <div className="liquid-input mt-1.5 flex items-center rounded-2xl">
                    <span className="select-none pl-3.5 pr-1 font-mono text-xs text-slate-400 sm:text-sm">
                      /s/
                    </span>
                    <input
                      id="custom-alias-input"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={customAlias}
                      onChange={(e) => {
                        setCustomAlias(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="launch-notes"
                      className="min-h-[44px] w-full bg-transparent pr-3.5 font-mono text-sm text-[#f5f4f0] placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                  className="mt-3 flex items-start gap-2.5 rounded-2xl border border-rose-400/30 bg-rose-500/15 px-3.5 py-2.5 text-sm text-rose-200 backdrop-blur-md"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Quick sample links row */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-3 text-xs text-slate-400">
            <span>Try an example:</span>
            {SAMPLE_URLS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setUrlInput(sample.value);
                  setErrorMsg(null);
                  inputRef.current?.focus();
                }}
                className="font-medium text-amber-300 underline decoration-amber-300/35 underline-offset-4 transition-colors hover:text-amber-200 hover:decoration-amber-200 cursor-pointer"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Instant Result Liquid Glass Card */}
        <AnimatePresence>
          {latestLink && (
            <motion.div
              key={latestLink.code}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              aria-live="polite"
              className="liquid-glass mt-4 rounded-3xl p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                    <span className="font-semibold text-emerald-400">Ready to share</span>
                    <span aria-hidden="true">·</span>
                    <span>{latestLink.protocolLabel}</span>
                  </div>
                  <a
                    href={latestLink.shortPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block truncate font-mono text-base font-medium text-amber-300 hover:underline sm:text-lg"
                  >
                    {latestShortUrl}
                  </a>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {latestLink.originalUrl}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(latestShortUrl)}
                    className="liquid-btn-primary inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy Link
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenQr(latestLink)}
                    aria-label={`Show QR code for ${latestLink.code}`}
                    className="liquid-btn-glass inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    QR Code
                  </button>

                  <a
                    href={latestLink.shortPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open shortened link ${latestLink.code}`}
                    className="liquid-btn-glass inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
