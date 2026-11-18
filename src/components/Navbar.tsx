import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { PageRoute } from '../types';

interface NavbarProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
  onPrimaryAction: () => void;
}

const NAV_ITEMS: Array<{ route: PageRoute; label: string }> = [
  { route: '/', label: 'Shortener' },
  { route: '/about', label: 'About Us' },
  { route: '/privacy', label: 'Privacy Policy' },
  { route: '/security', label: 'Security' },
];

export function Navbar({
  currentRoute,
  onNavigate,
  onPrimaryAction,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (route: PageRoute) => {
    setMobileOpen(false);
    onNavigate(route);
  };

  return (
    <header className="sticky top-0 z-40 liquid-header">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3 sm:px-6">
        {/* Zone 1: Single-line Editorial Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('/');
          }}
          className="font-display text-xl font-semibold tracking-tight text-[#f5f4f0] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 rounded-md"
        >
          PrismLink
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <a
                key={item.route}
                href={item.route}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.route);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 rounded-sm ${
                  isActive
                    ? 'text-[#f5f4f0]'
                    : 'text-slate-400 hover:text-[#f5f4f0]'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-underline"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-amber-400"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Single primary liquid-glass action (desktop) + mobile menu button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onPrimaryAction();
            }}
            className="liquid-btn-primary hidden sm:inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 cursor-pointer"
          >
            Shorten URL
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="liquid-btn-glass inline-flex md:hidden items-center justify-center min-h-[44px] min-w-[44px] rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Liquid Glass Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav-drawer"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden border-t border-white/10 bg-[#0b0e15]/90 backdrop-blur-2xl px-4 pb-4 pt-2"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = currentRoute === item.route;
                return (
                  <a
                    key={item.route}
                    href={item.route}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.route);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-[44px] items-center rounded-xl px-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-amber-400/15 text-amber-300 font-semibold'
                        : 'text-slate-300 hover:bg-white/10 hover:text-[#f5f4f0]'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onPrimaryAction();
                }}
                className="liquid-btn-primary mt-2 flex min-h-[44px] w-full items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold cursor-pointer"
              >
                Shorten URL
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
