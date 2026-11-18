import { motion } from 'motion/react';
import type { PageRoute } from '../types';

interface AboutPageProps {
  onNavigate: (route: PageRoute) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      aria-labelledby="about-heading"
      className="mx-auto max-w-3xl py-8 sm:py-12"
    >
      <div className="mb-8">
        <p className="text-xs font-medium text-slate-400">
          Platform Overview · Stewardship
        </p>
        <h1
          id="about-heading"
          className="mt-2 font-display text-3xl font-bold tracking-tight text-[#f5f4f0] sm:text-4xl [text-wrap:balance]"
        >
          About PrismLink
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-300">
          PrismLink is a fast, account-free URL shortener designed to turn any valid link into a clean, shareable destination without sign-ups, clutter, or invasive tracking.
        </p>
      </div>

      <div className="space-y-4">
        <article className="liquid-glass rounded-3xl p-6 sm:p-7">
          <p className="text-xs font-medium text-amber-300">
            Administration
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-[#f5f4f0]">
            Admin — Aneek Sinha
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300 sm:text-base">
            PrismLink is administered and maintained by <strong className="font-semibold text-[#f5f4f0]">Aneek Sinha</strong>, overseeing service reliability, link-safety enforcement, protocol validation rules, and ongoing platform improvements.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-xs text-slate-400">
            <span>Role: Platform Administrator</span>
            <span aria-hidden="true">·</span>
            <span>Focus: Speed, Privacy &amp; Safe Routing</span>
          </div>
        </article>

        <article className="liquid-glass rounded-3xl p-6 sm:p-7">
          <h2 className="font-display text-xl font-semibold text-[#f5f4f0]">
            01. Built for Every Link Type
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300 sm:text-base">
            Most shorteners only accept standard web URLs. PrismLink normalizes and shortens HTTP/HTTPS pages, bare domain names, email drafts (<code className="font-mono text-xs text-amber-200">mailto:</code>), phone numbers (<code className="font-mono text-xs text-amber-200">tel:</code>), magnet links, file transfer URIs, and native application deep links.
          </p>
        </article>

        <article className="liquid-glass rounded-3xl p-6 sm:p-7">
          <h2 className="font-display text-xl font-semibold text-[#f5f4f0]">
            02. Zero-Friction Access
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300 sm:text-base">
            Every core feature—custom aliases, live click counters, downloadable PNG QR codes, and the Link Safety Inspector—works immediately without creating an account or verifying an email address.
          </p>
        </article>

        <article className="liquid-glass rounded-3xl p-6 sm:p-7">
          <h2 className="font-display text-xl font-semibold text-[#f5f4f0]">
            03. Transparency &amp; Safe Redirects
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300 sm:text-base">
            Before opening an unfamiliar short link, anyone can inspect its resolved destination and protocol safety checks on the Security page. Dangerous script schemes and self-referential redirect loops are blocked automatically.
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

        <div className="flex flex-wrap items-center gap-6">
          <a
            href="/privacy"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/privacy');
            }}
            className="text-sm font-semibold text-amber-300 underline decoration-amber-300/35 underline-offset-4 hover:text-amber-200"
          >
            Privacy Policy
          </a>
          <a
            href="/security"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/security');
            }}
            className="text-sm font-semibold text-amber-300 underline decoration-amber-300/35 underline-offset-4 hover:text-amber-200"
          >
            Security
          </a>
        </div>
      </div>
    </motion.section>
  );
}
