import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeftRight,
  Building2,
  GraduationCap,
  Info,
  LayoutDashboard,
  Moon,
  Sun,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../lib/hooks';
import { Button, Modal } from './ui';

const NAV_LINKS = [
  { to: '/', label: 'Ringkasan', icon: LayoutDashboard },
  { to: '/jurusan', label: 'Jurusan', icon: GraduationCap },
  { to: '/ptn', label: 'PTN', icon: Building2 },
  { to: '/banding', label: 'Perbandingan', icon: ArrowLeftRight },
];

export default function Layout() {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4">
        <nav
          className="glass mx-auto flex max-w-[1500px] items-center gap-2 rounded-2xl px-3 py-2.5 shadow-soft dark:shadow-none"
          aria-label="Navigasi utama"
        >
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-xl px-1.5 py-1"
            aria-label="Beranda Kampus Dashboard"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary via-secondary to-accent text-white shadow-glow dark:shadow-none">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="hidden text-base font-bold tracking-tight md:block">
              Kampus <span className="text-gradient">Dashboard</span>
            </span>
          </Link>

          <div className="ml-1 flex flex-1 items-center gap-0.5 overflow-x-auto py-0.5">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary'
                        : 'text-muted hover:text-ink dark:hover:text-slate-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      ) : null}
                      <Icon className="relative h-4 w-4" />
                      <span className="relative whitespace-nowrap">{link.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          <button
            onClick={() => setInfoOpen(true)}
            aria-label="Tentang dashboard"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-white/60 text-muted transition-colors hover:text-ink dark:border-slate-700 dark:bg-slate-800/60 dark:hover:text-slate-100"
          >
            <Info className="h-4 w-4" />
          </button>

          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-white/60 text-muted transition-colors hover:text-ink dark:border-slate-700 dark:bg-slate-800/60 dark:hover:text-slate-100"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="inline-flex"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="border-t border-line bg-white/50 py-8 backdrop-blur dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-[1500px] px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
                <GraduationCap className="h-4 w-4" />
              </span>
              <span className="font-semibold">Dashboard SNBP &amp; SNBT Indonesia</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted">
              <span>
                <span className="font-medium text-ink dark:text-slate-200">Data Source:</span>{' '}
                sidatagrun
              </span>
              <span>
                <span className="font-medium text-ink dark:text-slate-200">Versi:</span> v1.0.0
              </span>
              <span>
                <span className="font-medium text-ink dark:text-slate-200">Developer:</span>{' '}
                Achmad Baihaqih
              </span>
              <span className="inline-flex items-center gap-1">
                <ListChecks className="h-3.5 w-3.5" />
                SNBP · SNBT · 2021–2025
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-line bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" /> Built with AI
              </span>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            © {new Date().getFullYear()} Dashboard SNBP &amp; SNBT Indonesia — analisis daya
            tampung, peminat, dan rasio keketatan seluruh PTN · dibangun oleh Achmad Baihaqih
            dengan bantuan AI.
          </p>
        </div>
      </footer>

      <Modal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title="Tentang Dashboard"
        footer={<Button onClick={() => setInfoOpen(false)}>Tutup</Button>}
      >
        <div className="space-y-4 text-sm text-muted">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-ink dark:text-slate-100">
                Dashboard SNBP &amp; SNBT Indonesia
              </p>
              <p className="mt-1">
                Menampilkan daya tampung, peminat, dan rasio keketatan seluruh jurusan Perguruan
                Tinggi Negeri untuk seleksi SNBP dan SNBT.
              </p>
            </div>
          </div>
          <ul className="space-y-1.5">
            <li>
              <span className="font-semibold text-ink dark:text-slate-100">Data Source:</span>{' '}
              sidatagrun — daftar PTN &amp; prodi SNBP/SNBT
            </li>
            <li>
              <span className="font-semibold text-ink dark:text-slate-100">Periode:</span> 2021–2025
            </li>
            <li>
              <span className="font-semibold text-ink dark:text-slate-100">Versi:</span> v1.0.0
            </li>
            <li>
              <span className="font-semibold text-ink dark:text-slate-100">Developer:</span>{' '}
              Achmad Baihaqih · Built with AI
            </li>
          </ul>
          <p className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
            Rasio keketatan dihitung sebagai daya tampung dibagi peminat (%). Semakin kecil angkanya,
            semakin ketat persaingan masuk jurusan tersebut.
          </p>
        </div>
      </Modal>
    </div>
  );
}
