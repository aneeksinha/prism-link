import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AboutPage } from './components/AboutPage';
import { CapabilitiesGrid } from './components/CapabilitiesGrid';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { PrivacyPage } from './components/PrivacyPage';
import { QrCodeModal } from './components/QrCodeModal';
import { RecentLinksList } from './components/RecentLinksList';
import { SecurityPage } from './components/SecurityPage';
import { ShortenerWorkspace } from './components/ShortenerWorkspace';
import type { PageRoute, ShortenedLink } from './types';

const STORAGE_KEY = 'prismlink_recent_links_v1';
const BACKDROP_IMAGE = '/src/assets/images/dark_liquid_glass_1795011481580.jpg';

function resolveRoute(pathname: string): PageRoute {
  if (pathname === '/about') return '/about';
  if (pathname === '/privacy') return '/privacy';
  if (pathname === '/security') return '/security';
  return '/';
}

function loadStoredLinks(): ShortenedLink[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ShortenedLink[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [route, setRoute] = useState<PageRoute>(() =>
    resolveRoute(window.location.pathname)
  );
  const [recentLinks, setRecentLinks] = useState<ShortenedLink[]>(() =>
    loadStoredLinks()
  );
  const [qrLink, setQrLink] = useState<ShortenedLink | null>(null);
  const [backdropAvailable, setBackdropAvailable] = useState(true);
  const urlInputRef = useRef<HTMLInputElement | null>(null);

  // Sync browser Back/Forward navigation
  useEffect(() => {
    const onPopState = () => {
      setRoute(resolveRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Update page title per active view
  useEffect(() => {
    if (route === '/about') {
      document.title = 'About Us — PrismLink';
    } else if (route === '/privacy') {
      document.title = 'Privacy Policy — PrismLink';
    } else if (route === '/security') {
      document.title = 'Security — PrismLink';
    } else {
      document.title = 'PrismLink — Universal URL Shortener';
    }
  }, [route]);

  // Persist local link history
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recentLinks));
    } catch {
      // Ignore storage quota errors
    }
  }, [recentLinks]);

  const recentLinksRef = useRef<ShortenedLink[]>(recentLinks);
  recentLinksRef.current = recentLinks;

  const refreshRecentLinks = useCallback(() => {
    const current = recentLinksRef.current;
    if (current.length === 0) return;
    const codes = current.map((l) => l.code).join(',');

    fetch(`/api/links?codes=${encodeURIComponent(codes)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { links?: ShortenedLink[] } | null) => {
        if (!data?.links) return;
        const serverMap = new Map(
          data.links.map((item) => [item.code.toLowerCase(), item])
        );
        setRecentLinks((prev) =>
          prev.map((item) => serverMap.get(item.code.toLowerCase()) ?? item)
        );
      })
      .catch(() => {
        // Ignore transient offline refresh failures
      });
  }, []);

  // Refresh live click counts from server on route change, window focus, and tab visibility
  useEffect(() => {
    refreshRecentLinks();

    const onFocus = () => refreshRecentLinks();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshRecentLinks();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [route, refreshRecentLinks]);

  const handleLinkOpened = useCallback(() => {
    window.setTimeout(refreshRecentLinks, 700);
    window.setTimeout(refreshRecentLinks, 2000);
  }, [refreshRecentLinks]);

  const navigateTo = useCallback((target: PageRoute) => {
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
    }
    setRoute(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePrimaryAction = useCallback(() => {
    if (route !== '/') {
      window.history.pushState({}, '', '/');
      setRoute('/');
      window.setTimeout(() => {
        urlInputRef.current?.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 120);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      urlInputRef.current?.focus();
    }
  }, [route]);

  const handleLinkCreated = useCallback((link: ShortenedLink) => {
    setRecentLinks((prev) => {
      const filtered = prev.filter(
        (item) => item.code.toLowerCase() !== link.code.toLowerCase()
      );
      return [link, ...filtered].slice(0, 25);
    });
  }, []);

  const handleRemoveLink = useCallback((code: string) => {
    setRecentLinks((prev) =>
      prev.filter((item) => item.code.toLowerCase() !== code.toLowerCase())
    );
  }, []);

  const handleClearHistory = useCallback(() => {
    setRecentLinks([]);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col text-[#f5f4f0]">
      {/* Ambient Atmospheric Dark Liquid Glass Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#06080c] via-[#0b0e16] to-[#05070a]"
      >
        {backdropAvailable && (
          <img
            src={BACKDROP_IMAGE}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBackdropAvailable(false)}
            className="h-full w-full object-cover opacity-75"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07090d]/55 via-[#07090d]/45 to-[#06080c]/85" />
      </div>

      <Navbar
        currentRoute={route}
        onNavigate={navigateTo}
        onPrimaryAction={handlePrimaryAction}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {route === '/' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <ShortenerWorkspace
                inputRef={urlInputRef}
                recentLinks={recentLinks}
                onLinkCreated={handleLinkCreated}
                onOpenQr={(link) => setQrLink(link)}
                onLinkOpened={handleLinkOpened}
              />
              <RecentLinksList
                links={recentLinks}
                onRemoveLink={handleRemoveLink}
                onOpenQr={(link) => setQrLink(link)}
                onLinkOpened={handleLinkOpened}
              />
              <CapabilitiesGrid onNavigate={navigateTo} />
            </motion.div>
          )}

          {route === '/about' && (
            <AboutPage key="about" onNavigate={navigateTo} />
          )}

          {route === '/privacy' && (
            <PrivacyPage
              key="privacy"
              savedLinksCount={recentLinks.length}
              onClearHistory={handleClearHistory}
              onNavigate={navigateTo}
            />
          )}

          {route === '/security' && (
            <SecurityPage key="security" onNavigate={navigateTo} />
          )}
        </AnimatePresence>
      </main>

      <Footer onNavigate={navigateTo} />

      <QrCodeModal
        link={qrLink}
        shortUrl={qrLink ? `${window.location.origin}${qrLink.shortPath}` : ''}
        onClose={() => setQrLink(null)}
      />
    </div>
  );
}
