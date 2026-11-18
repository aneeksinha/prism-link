import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ShortenedLink } from '../types';

interface QrCodeModalProps {
  link: ShortenedLink | null;
  shortUrl: string;
  onClose: () => void;
}

export function QrCodeModal({ link, shortUrl, onClose }: QrCodeModalProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!link) {
      setDataUrl('');
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(shortUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#090b10',
        light: '#f5f4f0',
      },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [link, shortUrl]);

  useEffect(() => {
    if (!link) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [link, onClose]);

  return (
    <AnimatePresence>
      {link && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass w-full max-w-sm rounded-3xl p-6 text-[#f5f4f0]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="qr-modal-title" className="font-display text-xl font-semibold text-[#f5f4f0]">
                  QR Code
                </h2>
                <p className="mt-0.5 font-mono text-xs text-amber-300 break-all">
                  {shortUrl}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close QR code dialog"
                className="liquid-btn-glass inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-center rounded-2xl border border-white/15 bg-[#f5f4f0] p-4 shadow-inner">
              {dataUrl ? (
                <img
                  src={dataUrl}
                  alt={`QR code for ${shortUrl}`}
                  className="h-52 w-52 object-contain"
                />
              ) : (
                <div className="flex h-52 w-52 items-center justify-center text-sm text-slate-700">
                  Generating QR code...
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-400 truncate">
              Destination: {link.originalUrl}
            </p>

            <div className="mt-5 flex items-center gap-3">
              {dataUrl && (
                <a
                  href={dataUrl}
                  download={`prismlink-${link.code}.png`}
                  className="liquid-btn-primary inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="liquid-btn-glass inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
