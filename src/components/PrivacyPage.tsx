import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { PageRoute } from '../types';

interface PrivacyPageProps {
  savedLinksCount: number;
  onClearHistory: () => void;
  onNavigate: (route: PageRoute) => void;
}

export function PrivacyPage({
  savedLinksCount,
  onClearHistory,
  onNavigate,
}: PrivacyPageProps) {
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    onClearHistory();
    setCleared(true);
    window.setTimeout(() => setCleared(false), 2400);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-labelledby="privacy-heading"
      className="mx-auto max-w-3xl py-8 sm:py-12"
    >
      <div className="mb-8">
        <p className="text-xs font-medium text-slate-400">
          Effective November 2026 · Zero-Account Architecture
        </p>
        <h1
          id="privacy-heading"
          className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#f5f4f0] sm:text-4xl [text-wrap:balance]"
        >
          Privacy Policy
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-300">
          PrismLink is engineered to shorten links without user accounts, sign-ups, behavioral tracking, or personal profiling.
        </p>
      </div>

      <div className="space-y-4">
        <article className="liquid-glass rounded-3xl p-6 sm:p-7">
          <h2 className="font-display text-xl font-semibold text-[#f5f4f0]">
            01. No Accounts, No Personal Data Collection
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300 sm:text-base">
            There is no registration, login, email verification, or user profile database on PrismLink. We do not collect names, email addresses, passwords, IP geolocation logs, browser fingerprints, or advertising identifiers.
          </p>
        </article>

        <article className="liquid-glass rounded-3xl p-6 sm:p-7">
          <h2 className="font-display text-xl font-semibold text-[#f5f4f0]">
            02. Minimal Link Record Storage
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300 sm:text-base">
            To resolve short links when anyone visits <code className="font-mono text-xs text-amber-200">/s/:code</code>, the server stores strictly the minimum routing record required:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300 sm:text-base">
            <li>• The destination URL you submitted (after scheme normalization)</li>
            <li>• The generated short code or chosen custom alias</li>
            <li>• Creation timestamp and an aggregate numeric click counter</li>
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Individual visitor click events, referrers, user-agent strings, and IP addresses are never logged alongside the counter.
          </p>
        </article>

        <article className="liquid-glass rounded-3xl p-6 sm:p-7">
          <h2 className="font-display text-xl font-semibold text-[#f5f4f0]">
            03. Local Browser History &amp; Control
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300 sm:text-base">
            Your &ldquo;Recent Links&rdquo; list on the homepage is stored solely inside your own browser&rsquo;s <code className="font-mono text-xs text-amber-200">localStorage</code> so you can revisit links you created without signing in. Other visitors cannot see your history list.
          </p>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-300 tabular-nums">
              Currently storing <strong className="text-[#f5f4f0]">{savedLinksCount}</strong>{' '}
              {savedLinksCount === 1 ? 'link' : 'links'} in this browser.
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={savedLinksCount === 0 && !cleared}
              className="liquid-btn-glass inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap cursor-pointer"
            >
              {cleared ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Browser History Cleared
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Local History
                </>
              )}
            </button>
          </div>
        </article>

        <article className="liquid-glass rounded-3xl p-6 sm:p-7">
          <h2 className="font-display text-xl font-semibold text-[#f5f4f0]">
            04. Third-Party Cookies &amp; External Assets
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300 sm:text-base">
            PrismLink sets no tracking cookies and embeds no third-party analytics pixels. QR codes are rendered directly inside your browser without transmitting destination URLs to an external QR API.
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
          href="/security"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/security');
          }}
          className="text-sm font-semibold text-amber-300 underline decoration-amber-300/35 underline-offset-4 hover:text-amber-200"
        >
          View Security Architecture
        </a>
      </div>
    </motion.section>
  );
}
