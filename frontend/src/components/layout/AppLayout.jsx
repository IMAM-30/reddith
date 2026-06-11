import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import LeftSidebar from './LeftSidebar';
import ChatWidget from '../chat/ChatWidget';
import MobileBottomNav from './MobileBottomNav';
import { useAuth } from '../../context/AuthContext';
import { useNotificationCount } from '../../hooks/useNotificationCount';
import { FEATURES } from '../../config/features';

export default function AppLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const hideSidebar = pathname.startsWith('/profile/');

  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { count: notifCount, setCount: setNotifCount, refresh: refreshNotif } = useNotificationCount({
    enabled: FEATURES.notifications,
  });

  return (
    <div className="min-h-screen app-surface" style={{ color: 'var(--text-primary)' }}>
      <Navbar
        onChatToggle={FEATURES.chat ? () => setChatOpen((p) => !p) : undefined}
        unreadMessages={FEATURES.chat ? unreadCount : 0}
        unreadNotifications={FEATURES.notifications ? notifCount : 0}
      />
      <div className="max-w-[1320px] mx-auto px-3 sm:px-5 lg:px-6 pt-4 sm:pt-6 pb-28 lg:pb-8 flex gap-5 xl:gap-7">
        <LeftSidebar />
        <main className="flex-1 min-w-0">
          <div key={pathname} className="motion-page-enter">
            <Outlet context={{ refreshNotif, setNotifCount }} />
          </div>
        </main>
        {!hideSidebar && <Sidebar />}
      </div>
      {FEATURES.chat && user && (
        <ChatWidget
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          onUnreadChange={setUnreadCount}
        />
      )}
      <MobileBottomNav
        chatOpen={chatOpen}
        onChatToggle={FEATURES.chat ? () => setChatOpen((p) => !p) : undefined}
        onChatClose={() => setChatOpen(false)}
        unreadMessages={FEATURES.chat ? unreadCount : 0}
        unreadNotifications={FEATURES.notifications ? notifCount : 0}
      />
    </div>
  );
}
