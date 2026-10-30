import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <main id="main" tabIndex={-1} className="w-full max-w-md focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
}
