import { Outlet } from 'react-router-dom';
import { OfflineBanner } from '@/components/common/OfflineBanner';

export default function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <OfflineBanner />
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <main id="main" tabIndex={-1} className="w-full max-w-md focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
