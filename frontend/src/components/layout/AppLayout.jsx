import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import LeftSidebar from './LeftSidebar';
import ChatWidget from '../chat/ChatWidget';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const hideSidebar = pathname.startsWith('/profile/');

  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar
        onChatToggle={() => setChatOpen((p) => !p)}
        unreadMessages={unreadCount}
      />
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <LeftSidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
        {!hideSidebar && <Sidebar />}
      </div>
      {user && (
        <ChatWidget
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          onUnreadChange={setUnreadCount}
        />
      )}
    </div>
  );
}
