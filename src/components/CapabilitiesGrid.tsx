import type { PageRoute } from '../types';

interface CapabilitiesGridProps {
  onNavigate: (route: PageRoute) => void;
}

export function CapabilitiesGrid({ onNavigate }: CapabilitiesGridProps) {
  return (
    <section aria-labelledby="capabilities-heading" className="mx-auto max-w-5xl py-10 sm:py-14">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="capabilities-heading"
            className="font-display text-2xl font-semibold tracking-tight text-[#f5f4f0] sm:text-3xl"
          >
            Built for every valid link format
          </h2>
          <p className="mt-1.5 text-sm text-slate-300 sm:text-base">
            From web addresses to native app URIs, every link is validated before redirection.
          </p>
        </div>
      </div>

      {/* Asymmetric Bento Layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <article className="liquid-glass-subtle rounded-3xl p-6 md:col-span-7">
          <h3 className="font-display text-xl font-semibold text-[#f5f4f0]">
            01. Universal URI Normalization
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Paste full <code className="font-mono text-xs text-amber-200">https://</code> addresses, bare domain names, query-heavy tracking parameters, <code className="font-mono text-xs text-amber-200">mailto:</code> drafts, <code className="font-mono text-xs text-amber-200">tel:</code> phone numbers, <code className="font-mono text-xs text-amber-200">magnet:</code> links, or native desktop deep links like <code className="font-mono text-xs text-amber-200">vscode://</code> and <code className="font-mono text-xs text-amber-200">spotify://</code>.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-slate-400">
            <span>http / https</span>
            <span aria-hidden="true">·</span>
            <span>mailto / tel / sms</span>
            <span aria-hidden="true">·</span>
            <span>ftp / wss / magnet</span>
            <span aria-hidden="true">·</span>
            <span>custom schemes</span>
          </div>
        </article>

        <article className="liquid-glass-subtle rounded-3xl p-6 md:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold text-[#f5f4f0]">
              02. Zero-Account Privacy
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              No sign-up walls, no cookies tracking your identity, and no third-party analytics scripts. Your link history stays inside your own browser storage.
            </p>
          </div>
          <div className="mt-5">
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/privacy');
              }}
              className="inline-flex items-center text-sm font-semibold text-amber-300 underline decoration-amber-300/35 underline-offset-4 transition-colors hover:text-amber-200"
            >
              Read Privacy Policy
            </a>
          </div>
        </article>

        <article className="liquid-glass-subtle rounded-3xl p-6 md:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold text-[#f5f4f0]">
              03. Pre-Redirect Safety Filtering
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Dangerous script protocols (<code className="font-mono text-xs text-amber-200">javascript:</code>, <code className="font-mono text-xs text-amber-200">data:</code>, <code className="font-mono text-xs text-amber-200">vbscript:</code>) and self-referential redirect loops are rejected before a short code is ever issued.
            </p>
          </div>
          <div className="mt-5">
            <a
              href="/security"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/security');
              }}
              className="inline-flex items-center text-sm font-semibold text-amber-300 underline decoration-amber-300/35 underline-offset-4 transition-colors hover:text-amber-200"
            >
              Inspect a Link &amp; Security Rules
            </a>
          </div>
        </article>

        <article className="liquid-glass-subtle rounded-3xl p-6 md:col-span-7">
          <h3 className="font-display text-xl font-semibold text-[#f5f4f0]">
            04. Direct Server Redirects &amp; QR Sharing
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Web links resolve with clean HTTP <code className="font-mono text-xs text-amber-200">302</code> redirects, while non-HTTP deep links hand off smoothly to your device handler. Every link includes an instant scannable PNG QR code for mobile sharing.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-slate-400">
            <span>HTTP 302 routing</span>
            <span aria-hidden="true">·</span>
            <span>Custom aliases</span>
            <span aria-hidden="true">·</span>
            <span>Downloadable QR PNG</span>
          </div>
        </article>
      </div>
    </section>
  );
}
