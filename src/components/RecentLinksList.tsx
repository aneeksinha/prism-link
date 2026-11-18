import { useState } from 'react';
import { Check, Copy, ExternalLink, QrCode, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ShortenedLink } from '../types';

interface RecentLinksListProps {
  links: ShortenedLink[];
  onRemoveLink: (code: string) => void;
  onOpenQr: (link: ShortenedLink) => void;
  onLinkOpened: () => void;
}

export function RecentLinksList({
  links,
  onRemoveLink,
  onOpenQr,
  onLinkOpened,
}: RecentLinksListProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = async (link: ShortenedLink) => {
    const fullUrl = `${window.location.origin}${link.shortPath}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
    } catch {
      const temp = document.createElement('input');
      temp.value = fullUrl;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }
    setCopiedCode(link.code);
    window.setTimeout(() => {
      setCopiedCode((prev) => (prev === link.code ? null : prev));
    }, 1800);
  };

  return (
    <section aria-labelledby="recent-links-heading" className="mx-auto max-w-3xl py-4">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2
          id="recent-links-heading"
          className="font-display text-xl font-semibold tracking-tight text-[#f5f4f0]"
        >
          Recent Links
        </h2>
        <span className="text-xs text-slate-400 tabular-nums">
          {links.length} {links.length === 1 ? 'link' : 'links'} saved in this browser
        </span>
      </div>

      {links.length === 0 ? (
        <div className="liquid-glass-subtle rounded-3xl px-6 py-8 text-center">
          <p className="text-sm font-medium text-slate-200">
            No shortened links in this browser yet.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Links you create appear here automatically with live click counts—stored locally with no account needed.
          </p>
        </div>
      ) : (
        <ul className="space-y-3" data-testid="recent-links-list">
          <AnimatePresence initial={false}>
            {links.map((link) => {
              const fullShortUrl = `${window.location.origin}${link.shortPath}`;
              const isCopied = copiedCode === link.code;

              return (
                <motion.li
                  key={link.code}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="liquid-glass-subtle rounded-2xl p-4 transition-colors hover:border-white/20"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
                        <span>{link.protocolLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-slate-200">
                          {link.clicks} {link.clicks === 1 ? 'click' : 'clicks'}
                        </span>
                      </div>

                      <a
                        href={link.shortPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onLinkOpened}
                        className="mt-1 block truncate font-mono text-sm font-medium text-amber-300 hover:underline sm:text-base"
                      >
                        {fullShortUrl}
                      </a>

                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {link.originalUrl}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(link)}
                        aria-label={`Copy short link ${link.code}`}
                        className="liquid-btn-glass inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenQr(link)}
                        aria-label={`QR code for ${link.code}`}
                        className="liquid-btn-glass inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl cursor-pointer"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>

                      <a
                        href={link.shortPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onLinkOpened}
                        aria-label={`Open short link ${link.code}`}
                        className="liquid-btn-glass inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>

                      <button
                        type="button"
                        onClick={() => onRemoveLink(link.code)}
                        aria-label={`Remove ${link.code} from history`}
                        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-transparent text-slate-400 transition-colors hover:border-rose-400/30 hover:bg-rose-500/15 hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
