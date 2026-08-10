import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { KampusProvider } from './context/KampusProvider';
import Layout from './components/Layout';
import { Background, BackToTop, HelpButton, ScrollProgress, ScrollToTop } from './components/chrome';
import { Skeleton } from './components/ui';

const Home = lazy(() => import('./pages/Home'));
const Jurusan = lazy(() => import('./pages/Jurusan'));
const Detail = lazy(() => import('./pages/Detail'));
const Ptn = lazy(() => import('./pages/Ptn'));
const Compare = lazy(() => import('./pages/Compare'));

function PageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <KampusProvider>
      <BrowserRouter>
        <Background />
        <ScrollProgress />
        <ScrollToTop />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="jurusan" element={<Jurusan />} />
              <Route path="jurusan/:ptnId/:prodiId" element={<Detail />} />
              <Route path="ptn" element={<Ptn />} />
              <Route path="banding" element={<Compare />} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </Suspense>
        <BackToTop />
        <HelpButton />
      </BrowserRouter>
    </KampusProvider>
  );
}
