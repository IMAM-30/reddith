import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import LeftSidebar from './LeftSidebar';

export default function AppLayout() {
  const { pathname } = useLocation();
  const isProfilePage = pathname.startsWith('/profile/');

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <LeftSidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
        {!isProfilePage && <Sidebar />}
      </div>
    </div>
  );
}
