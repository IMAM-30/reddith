import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const inputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

function timeShort(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  if (now - d < 86400000) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function timeOnly(dateStr) {
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function dateKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dateLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return d.toLocaleDateString('id-ID', { weekday: 'long' });
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}

function Avatar({ url, username, size = 'sm' }) {
  const sizes = { xs: 'w-6 h-6 text-[9px]', sm: 'w-8 h-8 text-[11px]', md: 'w-7 h-7 text-[10px]', lg: 'w-14 h-14 text-lg' };
  const s = sizes[size] || sizes.sm;
  if (url) return <img src={url} alt={username} className={`${s} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-bold text-white shrink-0`} style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
      {username?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

export default function ChatWidget({ open, onClose, onUnreadChange }) {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [size, setSize] = useState(null); // { width, height } — null = pakai default
  const resizingRef = useRef(null);
  const [confirmDel, setConfirmDel] = useState(null); // { kind: 'thread'|'message', ... } | null
  const [replyTo, setReplyTo] = useState(null); // { id, sender_id, body } | null
  const messagesScrollRef = useRef(null);
  const isAtBottomRef = useRef(true);

  const [showCreate, setShowCreate] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchError, setSearchError] = useState('');
  const [creating, setCreating] = useState(false);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const threadPollRef = useRef(null);

  // Default & batas ukuran resize
  const DEFAULT_HEIGHT = 480;
  const DEFAULT_WIDTH_CONV = 620;
  const RIGHT_OFFSET = 24;
  const TOP_RESERVE = 72;

  // Hitung batas max berdasar posisi <main> aktual — biar widget mepet
  // pinggir kiri konten utama, gak nutupin LeftSidebar
  const computeMaxW = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      const rect = mainEl.getBoundingClientRect();
      return Math.max(minWidth, window.innerWidth - RIGHT_OFFSET - rect.left);
    }
    return window.innerWidth - RIGHT_OFFSET - 320;
  };
  const minWidth = DEFAULT_WIDTH_CONV;
  const minHeight = DEFAULT_HEIGHT;

  const startResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size?.width ?? minWidth;
    const startH = size?.height ?? minHeight;
    resizingRef.current = { startX, startY, startW, startH };

    const onMove = (ev) => {
      const dx = startX - ev.clientX;
      const dy = startY - ev.clientY;
      const maxW = computeMaxW();
      const maxH = window.innerHeight - TOP_RESERVE;
      const newW = Math.max(minWidth, Math.min(maxW, startW + dx));
      const newH = Math.max(minHeight, Math.min(maxH, startH + dy));
      setSize({ width: newW, height: newH });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = '';
      resizingRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.body.style.userSelect = 'none';
  };

  // Load threads + poll for unread
  useEffect(() => {
    if (!user) return;
    const loadThreads = () => {
      api.get('/messages/threads').then((res) => {
        setThreads(res.data);
        setLoadingThreads(false);
        const total = res.data.reduce((sum, t) => sum + (t.unread_count || 0), 0);
        onUnreadChange?.(total);
      }).catch(() => setLoadingThreads(false));
    };
    loadThreads();
    threadPollRef.current = setInterval(loadThreads, 10000);
    return () => clearInterval(threadPollRef.current);
  }, [user]);

  // Load conversation
  useEffect(() => {
    if (!activeThread) return;
    setLoadingMsgs(true);
    setShowCreate(false);

    const loadMessages = () => {
      api.get(`/messages/conversation/${activeThread.id}`).then((res) => {
        setMessages(res.data.data || []);
        setLoadingMsgs(false);
      });
    };
    loadMessages();

    const thread = threads.find((t) => t.user?.id === activeThread.id);
    if (thread && thread.unread_count > 0) {
      api.patch(`/messages/conversation/${activeThread.id}/read-all`).catch(() => {});
      setThreads((prev) => {
        const updated = prev.map((t) => t.user?.id === activeThread.id ? { ...t, unread_count: 0 } : t);
        const total = updated.reduce((sum, t) => sum + (t.unread_count || 0), 0);
        onUnreadChange?.(total);
        return updated;
      });
    }

    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [activeThread?.id]);

  // Smart auto-scroll: hanya scroll bawah kalau user sudah di bawah
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Reset scroll state saat ganti thread (langsung ke bawah)
  useEffect(() => {
    isAtBottomRef.current = true;
    setReplyTo(null);
  }, [activeThread?.id]);

  const handleScroll = () => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const threshold = 40;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeThread) return;
    setSending(true);
    isAtBottomRef.current = true; // saat kirim sendiri, auto-scroll ke bawah
    try {
      const res = await api.post('/messages', {
        username: activeThread.username,
        body: msgInput.trim(),
        reply_to_id: replyTo?.id || null,
      });
      setMessages((prev) => [...prev, { ...res.data, sender: { id: user.id, username: user.username, avatar_url: user.avatar_url } }]);
      setMsgInput('');
      setReplyTo(null);
      setThreads((prev) => prev.map((t) =>
        t.user?.id === activeThread.id
          ? { ...t, last_message: { ...res.data, body: msgInput.trim(), sender_id: user.id, created_at: new Date().toISOString() } }
          : t
      ));
    } finally { setSending(false); }
  };

  const handleCreateChat = async (e) => {
    e?.preventDefault?.();
    if (!searchUser.trim()) return;
    setCreating(true);
    setSearchError('');
    try {
      const res = await api.get(`/users/${searchUser.trim()}`);
      const f = res.data;
      if (f.id === user.id) { setSearchError('Tidak bisa chat dengan diri sendiri.'); setCreating(false); return; }
      const existing = threads.find((t) => t.user?.id === f.id);
      if (existing) { setActiveThread(existing.user); }
      else {
        const nu = { id: f.id, username: f.username, avatar_url: f.avatar, karma: f.karma ?? 0 };
        setThreads((prev) => [{ user: nu, last_message: null, unread_count: 0 }, ...prev]);
        setActiveThread(nu);
      }
      setShowCreate(false);
      setSearchUser('');
    } catch { setSearchError('User tidak ditemukan.'); }
    finally { setCreating(false); }
  };

  const performDeleteThread = async (threadUser) => {
    await api.delete(`/messages/thread/${threadUser.id}`);
    setThreads((prev) => prev.filter((t) => t.user?.id !== threadUser.id));
    if (activeThread?.id === threadUser.id) { setActiveThread(null); setMessages([]); }
    setConfirmDel(null);
  };

  const performDeleteMessage = async (msgId) => {
    await api.delete(`/messages/${msgId}`);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setThreads((prev) => prev.map((t) => {
      if (t.user?.id === activeThread?.id && t.last_message?.id === msgId) {
        const remaining = messages.filter((m) => m.id !== msgId);
        return { ...t, last_message: remaining.length > 0 ? remaining[remaining.length - 1] : null };
      }
      return t;
    }));
    setConfirmDel(null);
  };

  const runConfirm = () => {
    if (!confirmDel) return;
    if (confirmDel.kind === 'thread') performDeleteThread(confirmDel.user);
    else if (confirmDel.kind === 'message') performDeleteMessage(confirmDel.id);
  };

  if (!open || !user) return null;

  // Minimized state — just header bar
  if (minimized) {
    const totalUnread = threads.reduce((s, t) => s + (t.unread_count || 0), 0);
    return (
      <div className="fixed bottom-0 right-6 z-50 w-72 rounded-t-xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderBottom: 'none' }}>
        <div className="flex items-center justify-between px-3 h-10 cursor-pointer" onClick={() => setMinimized(false)} style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>R</div>
            <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>Chats</span>
            {totalUnread > 0 && <span className="text-[10px] font-bold text-orange-500">{totalUnread}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setMinimized(false); }} className="w-5 h-5 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-5 h-5 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="fixed bottom-0 right-6 z-50 flex rounded-t-xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderBottom: 'none', height: `${size?.height ?? minHeight}px`, width: `${size?.width ?? minWidth}px` }}>
      {/* Resize handle — pojok kiri atas, drag buat besarin */}
      <div
        onMouseDown={startResize}
        className="absolute top-0 left-0 w-4 h-4 z-10"
        style={{ cursor: 'nwse-resize' }}
        title="Drag untuk mengubah ukuran"
      >
        <svg viewBox="0 0 16 16" className="w-full h-full" style={{ color: 'var(--text-faint)' }}>
          <path d="M2 8 L8 2 M2 12 L12 2 M6 14 L14 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      {/* Left — Threads */}
      <div className="w-[300px] shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border-color)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-10 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>R</div>
            <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>Chats</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setShowCreate(true); setActiveThread(null); setSearchUser(''); setSearchError(''); }} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="New Chat">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
        </div>

        {/* Threads */}
        <div className="flex-1 overflow-y-auto">
          {loadingThreads ? (
            <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : threads.length === 0 ? (
            <div className="text-center py-6 px-3"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Belum ada percakapan</p></div>
          ) : (
            threads.map((thread) => {
              const isActive = activeThread?.id === thread.user?.id;
              return (
                <div key={thread.user?.id} className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors"
                  style={{ backgroundColor: isActive ? 'var(--bg-input)' : 'transparent' }}
                  onClick={() => { setActiveThread(thread.user); setShowCreate(false); }}>
                  <Avatar url={thread.user?.avatar_url} username={thread.user?.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{thread.user?.username}</span>
                      {thread.last_message && <span className="text-[10px] shrink-0 ml-1" style={{ color: 'var(--text-faint)' }}>{timeShort(thread.last_message.created_at)}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-[11px] truncate flex-1" style={{ color: thread.unread_count > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: thread.unread_count > 0 ? 600 : 400 }}>
                        {thread.last_message ? `${thread.last_message.sender_id === user.id ? 'You: ' : ''}${thread.last_message.body}` : 'Mulai percakapan...'}
                      </p>
                      {thread.unread_count > 0 && (
                        <span className="min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                          {thread.unread_count > 99 ? '99+' : thread.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right — Conversation / Create / Welcome */}
      {true && (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Create Chat */}
          {showCreate && (
            <>
              <div className="flex items-center justify-between px-3 h-10 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>Create Chat</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowCreate(false)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="Batal">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={() => setMinimized(true)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="Minimize">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button onClick={onClose} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="Close">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 p-3">
                <form onSubmit={handleCreateChat}>
                  <input type="text" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} placeholder="Type username(s) *"
                    className="w-full px-3 py-2.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/50" style={inputStyle} autoFocus />
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Search for people by username to chat with them.</p>
                  {searchError && <p className="text-[11px] mt-1 text-red-500">{searchError}</p>}
                </form>
              </div>
              <div className="flex items-center justify-end gap-2 px-3 py-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button onClick={() => setShowCreate(false)} className="px-3 py-1 text-xs font-medium rounded-full" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
                <button onClick={handleCreateChat} disabled={creating || !searchUser.trim()} className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500 text-white disabled:opacity-40">Create</button>
              </div>
            </>
          )}

          {/* Active conversation */}
          {!showCreate && activeThread && (
            <>
              <div className="flex items-center justify-between px-3 h-10 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <Avatar url={activeThread.avatar_url} username={activeThread.username} size="xs" />
                  <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{activeThread.username}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setConfirmDel({ kind: 'thread', user: activeThread })} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="Hapus percakapan">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <button onClick={() => setMinimized(true)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="Minimize">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button onClick={() => { setActiveThread(null); setMessages([]); }} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="Tutup percakapan">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div ref={messagesScrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                {loadingMsgs ? (
                  <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isMine = msg.sender_id === user.id || msg.sender?.id === user.id;
                      const prev = messages[idx - 1];
                      const showDate = !prev || dateKey(prev.created_at) !== dateKey(msg.created_at);
                      const isRead = isMine && !!msg.read_at;
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex items-center gap-2 my-3">
                              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: 'var(--text-faint)', backgroundColor: 'var(--bg-card)' }}>{dateLabel(msg.created_at)}</span>
                              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                            </div>
                          )}
                          <div
                            className={`flex mb-1 ${isMine ? 'justify-end' : 'justify-start'}`}
                            onMouseEnter={() => setHoveredMsg(msg.id)}
                            onMouseLeave={() => setHoveredMsg(null)}
                          >
                            <div className="relative" style={{ maxWidth: '75%' }}>
                              <div
                                className="px-2.5 py-1.5 rounded-2xl shadow-sm"
                                style={{
                                  backgroundColor: isMine ? '#dcf8c6' : 'var(--bg-card)',
                                  color: '#111',
                                  width: 'fit-content',
                                  maxWidth: '100%',
                                  borderTopRightRadius: isMine ? '4px' : undefined,
                                  borderTopLeftRadius: !isMine ? '4px' : undefined,
                                }}
                              >
                                {msg.reply_to && (
                                  <div className="mb-1 px-2 py-1 rounded-md text-[11px]" style={{ borderLeft: '3px solid #ff6b35', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                                    <div className="font-semibold text-orange-600">{msg.reply_to.sender_id === user.id ? 'You' : activeThread.username}</div>
                                    <div className="truncate opacity-80">{msg.reply_to.body}</div>
                                  </div>
                                )}
                                <p className="text-xs leading-snug whitespace-pre-wrap break-words">{msg.body}</p>
                                <div className="flex items-center justify-end gap-0.5 mt-0.5">
                                  <span className="text-[9px] text-gray-500">{timeOnly(msg.created_at)}</span>
                                  {isMine && (
                                    <svg className={`w-3 h-3 ${isRead ? 'text-blue-500' : 'text-gray-500'}`} viewBox="0 0 16 16" fill="none">
                                      <path d="M1 8 L5 12 L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M5 8 L9 12 L15 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              {hoveredMsg === msg.id && (
                                <div className={`absolute top-1/2 -translate-y-1/2 flex flex-col gap-0.5 ${isMine ? 'right-full mr-1' : 'left-full ml-1'}`}>
                                  <button onClick={() => setReplyTo({ id: msg.id, sender_id: msg.sender_id || msg.sender?.id, body: msg.body })} className="w-5 h-5 rounded flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="Reply">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                  </button>
                                  {isMine && (
                                    <button onClick={() => setConfirmDel({ kind: 'message', id: msg.id, body: msg.body })} className="w-5 h-5 rounded flex items-center justify-center" style={{ color: 'var(--text-faint)' }} title="Hapus">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="shrink-0" style={{ borderTop: '1px solid var(--border-color)' }}>
                {replyTo && (
                  <div className="flex items-center gap-2 px-3 py-1.5" style={{ backgroundColor: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="flex-1 min-w-0 px-2 py-1 rounded" style={{ borderLeft: '3px solid #ff6b35' }}>
                      <div className="text-[10px] font-semibold text-orange-500">{replyTo.sender_id === user.id ? 'You' : activeThread.username}</div>
                      <div className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>{replyTo.body}</div>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="w-5 h-5 flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="Batal reply">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
                <form onSubmit={sendMessage} className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={msgInput} onChange={(e) => setMsgInput(e.target.value)} placeholder="Message"
                      className="flex-1 px-3 py-2 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/50" style={inputStyle} />
                    <button type="submit" disabled={sending || !msgInput.trim()}
                      className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-500 text-white disabled:opacity-40 shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* Welcome — saat tidak ada chat dibuka & bukan create */}
          {!showCreate && !activeThread && (
            <div className="flex items-center justify-between px-3 h-10 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>Pesan</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setMinimized(true)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="Minimize">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <button onClick={onClose} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="Close">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          )}
          {!showCreate && !activeThread && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome to chat!</p>
              <p className="text-[11px] mb-4 max-w-[220px]" style={{ color: 'var(--text-muted)' }}>Pilih percakapan dari daftar di kiri atau mulai chat baru.</p>
              <button onClick={() => { setShowCreate(true); setSearchUser(''); setSearchError(''); }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-full transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                New chat
              </button>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Confirm delete modal — full-screen overlay */}
    {confirmDel && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} onClick={() => setConfirmDel(null)}>
        <div onClick={(e) => e.stopPropagation()} className="rounded-xl shadow-2xl w-[300px] overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="px-4 pt-4 pb-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {confirmDel.kind === 'thread' ? 'Hapus percakapan?' : 'Hapus pesan?'}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {confirmDel.kind === 'thread' ? (
                <>Semua pesan dengan <span className="font-semibold">{confirmDel.user.username}</span> akan dihapus permanen.</>
              ) : (
                <>Pesan <span className="font-semibold">"{confirmDel.body?.length > 40 ? confirmDel.body.slice(0, 40) + '…' : confirmDel.body}"</span> akan dihapus permanen.</>
              )}
            </p>
          </div>
          <div className="flex border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 text-xs font-semibold transition-colors hover:bg-black/5" style={{ color: 'var(--text-secondary)' }}>
              Cancel
            </button>
            <div className="w-px" style={{ backgroundColor: 'var(--border-color)' }} />
            <button onClick={runConfirm} className="flex-1 py-2.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10">
              Yes, delete
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
