import type { PageRoute } from '../types';

interface FooterProps {
  onNavigate: (route: PageRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="mt-12 border-t border-white/10 bg-[#090c12]/65 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-display font-semibold text-[#f5f4f0]">PrismLink</span>
          <span aria-hidden="true">·</span>
          <span className="text-xs text-slate-400">
            Account-free universal URL shortener
          </span>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="transition-colors hover:text-[#f5f4f0]"
          >
            Shortener
          </a>
          <a
            href="/about"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/about');
            }}
            className="transition-colors hover:text-[#f5f4f0]"
          >
            About Us
          </a>
          <a
            href="/privacy"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/privacy');
            }}
            className="transition-colors hover:text-[#f5f4f0]"
          >
            Privacy Policy
          </a>
          <a
            href="/security"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/security');
            }}
            className="transition-colors hover:text-[#f5f4f0]"
          >
            Security
          </a>
        </nav>
      </div>
    </footer>
  );
}
