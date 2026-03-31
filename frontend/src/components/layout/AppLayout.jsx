import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import LeftSidebar from './LeftSidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <LeftSidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
        <Sidebar />
      </div>
    </div>
  );
}
