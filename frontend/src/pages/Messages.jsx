import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

function timeShort(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1440) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function Avatar({ url, username, size = 'sm' }) {
  const sizes = { xs: 'w-6 h-6 text-[9px]', sm: 'w-9 h-9 text-xs', md: 'w-7 h-7 text-[10px]', lg: 'w-16 h-16 text-xl' };
  const s = sizes[size] || sizes.sm;
  if (url) {
    return <img src={url} alt={username} className={`${s} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-bold text-white shrink-0`} style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
      {username?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchError, setSearchError] = useState('');
  const [creating, setCreating] = useState(false);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  // Load threads
  useEffect(() => {
    api.get('/messages/threads').then((res) => {
      setThreads(res.data);
      setLoadingThreads(false);
    });
  }, []);

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
      setThreads((prev) => prev.map((t) => t.user?.id === activeThread.id ? { ...t, unread_count: 0 } : t));
    }

    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [activeThread?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeThread) return;
    setSending(true);
    try {
      const res = await api.post('/messages', { username: activeThread.username, body: msgInput.trim() });
      setMessages((prev) => [...prev, { ...res.data, sender: { id: user.id, username: user.username, avatar_url: user.avatar_url } }]);
      setMsgInput('');
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
      const foundUser = res.data;
      if (foundUser.id === user.id) { setSearchError('Tidak bisa chat dengan diri sendiri.'); setCreating(false); return; }
      const existing = threads.find((t) => t.user?.id === foundUser.id);
      if (existing) { setActiveThread(existing.user); }
      else {
        const newThread = { user: { id: foundUser.id, username: foundUser.username, avatar_url: foundUser.avatar, karma: foundUser.karma ?? 0 }, last_message: null, unread_count: 0 };
        setThreads((prev) => [newThread, ...prev]);
        setActiveThread(newThread.user);
      }
      setShowCreate(false);
      setSearchUser('');
    } catch { setSearchError('User tidak ditemukan.'); }
    finally { setCreating(false); }
  };

  const deleteThread = async (threadUser) => {
    if (!confirm(`Hapus semua pesan dengan ${threadUser.username}?`)) return;
    await api.delete(`/messages/thread/${threadUser.id}`);
    setThreads((prev) => prev.filter((t) => t.user?.id !== threadUser.id));
    if (activeThread?.id === threadUser.id) { setActiveThread(null); setMessages([]); }
  };

  const deleteMessage = async (msgId) => {
    await api.delete(`/messages/${msgId}`);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    // Update last_message in thread if needed
    setThreads((prev) => prev.map((t) => {
      if (t.user?.id === activeThread?.id && t.last_message?.id === msgId) {
        const remaining = messages.filter((m) => m.id !== msgId);
        return { ...t, last_message: remaining.length > 0 ? remaining[remaining.length - 1] : null };
      }
      return t;
    }));
  };

  return (
    <div className="rounded-xl overflow-hidden flex" style={{ ...cardStyle, height: 'calc(100vh - 120px)', minHeight: '500px' }}>
      {/* Left Panel — Threads */}
      <div className="w-72 shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between px-4 h-12 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>R</div>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Chats</span>
          </div>
          <button
            onClick={() => { setShowCreate(true); setActiveThread(null); setSearchUser(''); setSearchError(''); }}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
            title="New Chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingThreads ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Belum ada percakapan</p>
            </div>
          ) : (
            threads.map((thread) => {
              const isActive = activeThread?.id === thread.user?.id;
              return (
                <div
                  key={thread.user?.id}
                  className="group relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                  style={{ backgroundColor: isActive ? 'var(--bg-input)' : 'transparent' }}
                  onClick={() => { setActiveThread(thread.user); setShowCreate(false); }}
                >
                  <Avatar url={thread.user?.avatar_url} username={thread.user?.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{thread.user?.username}</span>
                      {thread.last_message && (
                        <span className="text-[10px] shrink-0 ml-2" style={{ color: 'var(--text-faint)' }}>{timeShort(thread.last_message.created_at)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs truncate flex-1" style={{ color: thread.unread_count > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: thread.unread_count > 0 ? 600 : 400 }}>
                        {thread.last_message
                          ? `${thread.last_message.sender_id === user.id ? 'You: ' : ''}${thread.last_message.body}`
                          : 'Mulai percakapan...'}
                      </p>
                      {thread.unread_count > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {thread.unread_count > 99 ? '99+' : thread.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Delete thread button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteThread(thread.user); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-faint)' }}
                    title="Hapus percakapan"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Create Chat */}
        {showCreate && (
          <>
            <div className="flex items-center justify-between px-4 h-12 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Create Chat</span>
              <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-muted)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 p-4">
              <form onSubmit={handleCreateChat}>
                <input type="text" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} placeholder="Type username(s) *"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50" style={inputStyle} autoFocus />
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Search for people by username to chat with them.</p>
                {searchError && <p className="text-xs mt-2 text-red-500">{searchError}</p>}
              </form>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 text-sm font-medium rounded-full" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleCreateChat} disabled={creating || !searchUser.trim()} className="px-4 py-1.5 text-sm font-medium rounded-full bg-blue-500 text-white disabled:opacity-40">
                {creating ? '...' : 'Create'}
              </button>
            </div>
          </>
        )}

        {/* Welcome */}
        {!showCreate && !activeThread && (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome to chat!</p>
            <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>Start a direct or group chat with other redditors.</p>
            <button
              onClick={() => { setShowCreate(true); setSearchUser(''); setSearchError(''); }}
              className="flex items-center gap-2 mt-5 px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Start new chat
            </button>
          </div>
        )}

        {/* Active conversation */}
        {!showCreate && activeThread && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-12 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <Avatar url={activeThread.avatar_url} username={activeThread.username} size="md" />
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{activeThread.username}</span>
              </div>
              <button
                onClick={() => deleteThread(activeThread)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="Hapus percakapan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* User info header */}
                  <div className="text-center mb-6 pt-4">
                    <div className="flex justify-center mb-2">
                      <Avatar url={activeThread.avatar_url} username={activeThread.username} size="lg" />
                    </div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{activeThread.username}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Redditor · {activeThread.karma ?? 0} karma</p>
                  </div>

                  {/* Date separator */}
                  {messages.length > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                      <span className="text-[10px] font-medium" style={{ color: 'var(--text-faint)' }}>
                        {new Date(messages[0].created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                      </span>
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                    </div>
                  )}

                  {/* Message bubbles */}
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user.id || msg.sender?.id === user.id;
                    const senderAvatar = isMine ? user.avatar_url : activeThread.avatar_url;
                    const senderName = isMine ? user.username : activeThread.username;
                    return (
                      <div
                        key={msg.id}
                        className="group flex items-start gap-2 mb-3"
                        onMouseEnter={() => setHoveredMsg(msg.id)}
                        onMouseLeave={() => setHoveredMsg(null)}
                      >
                        {!isMine && <Avatar url={senderAvatar} username={senderName} size="xs" />}
                        {isMine && <div className="flex-1" />}
                        <div className="max-w-[70%] relative">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{senderName}</span>
                            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                              {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{msg.body}</p>
                        </div>
                        {/* Delete own message */}
                        {isMine && hoveredMsg === msg.id && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-3 transition-opacity"
                            style={{ color: 'var(--text-faint)' }}
                            title="Hapus pesan"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <input type="text" value={msgInput} onChange={(e) => setMsgInput(e.target.value)} placeholder="Message"
                  className="flex-1 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50" style={inputStyle} />
                <button type="submit" disabled={sending || !msgInput.trim()}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-500 text-white disabled:opacity-40 shrink-0 transition-colors hover:bg-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
