import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ArrowUp, LifeBuoy } from 'lucide-react';
import { Tooltip } from './ui';

export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-canvas transition-colors dark:bg-slate-950" />
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black_35%,transparent_100%)]" />
      <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-primary/15 blur-3xl dark:bg-primary/10" />
      <div className="absolute -top-16 right-1/4 h-72 w-72 rounded-full bg-accent/15 blur-3xl dark:bg-accent/10" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-success/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-0 h-80 w-80 rounded-full bg-warning/10 blur-3xl" />
      <div className="absolute inset-0 bg-noise opacity-[0.35] dark:opacity-[0.1]" />
    </div>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-gradient-to-r from-primary via-accent to-success"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Kembali ke atas"
          className="glass fixed bottom-20 right-4 z-40 grid h-11 w-11 place-items-center rounded-2xl text-ink shadow-lift transition-transform hover:scale-105 dark:text-slate-100 dark:shadow-none"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}

export function HelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-72 rounded-2xl border border-line bg-white/95 p-4 shadow-lift backdrop-blur dark:border-slate-700 dark:bg-slate-800/70"
          >
            <p className="font-semibold">Butuh bantuan?</p>
            <p className="mt-1 text-sm text-muted">
              Jelajahi halaman Jurusan untuk mencari data daya tampung &amp; peminat, atau gunakan
              Perbandingan untuk melihat SNBP vs SNBT.
            </p>
            <p className="mt-2 text-xs text-muted">Data sumber: sidatagrun · periode 2021–2025</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <Tooltip label={open ? 'Tutup bantuan' : 'Bantuan'}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Bantuan"
          aria-expanded={open}
          className="glass grid h-11 w-11 place-items-center rounded-2xl text-ink shadow-lift transition-transform hover:scale-105 dark:text-slate-100 dark:shadow-none"
        >
          <LifeBuoy className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>
  );
}
