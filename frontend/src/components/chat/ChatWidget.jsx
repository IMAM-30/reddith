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

  const [showCreate, setShowCreate] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [searchError, setSearchError] = useState('');
  const [creating, setCreating] = useState(false);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const threadPollRef = useRef(null);

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

  const deleteThread = async (threadUser) => {
    if (!confirm(`Hapus semua pesan dengan ${threadUser.username}?`)) return;
    await api.delete(`/messages/thread/${threadUser.id}`);
    setThreads((prev) => prev.filter((t) => t.user?.id !== threadUser.id));
    if (activeThread?.id === threadUser.id) { setActiveThread(null); setMessages([]); }
  };

  const deleteMessage = async (msgId) => {
    await api.delete(`/messages/${msgId}`);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setThreads((prev) => prev.map((t) => {
      if (t.user?.id === activeThread?.id && t.last_message?.id === msgId) {
        const remaining = messages.filter((m) => m.id !== msgId);
        return { ...t, last_message: remaining.length > 0 ? remaining[remaining.length - 1] : null };
      }
      return t;
    }));
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
    <div className="fixed bottom-0 right-6 z-50 flex rounded-t-xl overflow-hidden shadow-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderBottom: 'none', height: '480px', width: activeThread || showCreate ? '620px' : '300px' }}>
      {/* Left — Threads */}
      <div className="w-[300px] shrink-0 flex flex-col" style={{ borderRight: activeThread || showCreate ? '1px solid var(--border-color)' : 'none' }}>
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
            <button onClick={() => setMinimized(true)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <button onClick={onClose} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
                <div key={thread.user?.id} className="group relative flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors"
                  style={{ backgroundColor: isActive ? 'var(--bg-input)' : 'transparent' }}
                  onClick={() => { setActiveThread(thread.user); setShowCreate(false); }}>
                  <Avatar url={thread.user?.avatar_url} username={thread.user?.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{thread.user?.username}</span>
                      {thread.last_message && <span className="text-[10px] shrink-0 ml-1" style={{ color: 'var(--text-faint)' }}>{timeShort(thread.last_message.created_at)}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-[11px] truncate" style={{ color: thread.unread_count > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {thread.last_message ? `${thread.last_message.sender_id === user.id ? 'You: ' : ''}${thread.last_message.body}` : 'Mulai percakapan...'}
                      </p>
                      {thread.unread_count > 0 && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteThread(thread.user); }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100"
                    style={{ color: 'var(--text-faint)' }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right — Conversation / Create / Welcome */}
      {(activeThread || showCreate) && (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Create Chat */}
          {showCreate && (
            <>
              <div className="flex items-center justify-between px-3 h-10 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>Create Chat</span>
                <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-muted)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
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
                <button onClick={() => deleteThread(activeThread)} className="w-5 h-5 flex items-center justify-center" style={{ color: 'var(--text-muted)' }} title="Hapus">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3">
                {loadingMsgs ? (
                  <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                  <>
                    <div className="text-center mb-4 pt-2">
                      <div className="flex justify-center mb-1.5"><Avatar url={activeThread.avatar_url} username={activeThread.username} size="lg" /></div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{activeThread.username}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Redditor · {activeThread.karma ?? 0} karma</p>
                    </div>
                    {messages.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{new Date(messages[0].created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-color)' }} />
                      </div>
                    )}
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === user.id || msg.sender?.id === user.id;
                      return (
                        <div key={msg.id} className="group flex items-start gap-1.5 mb-2.5" onMouseEnter={() => setHoveredMsg(msg.id)} onMouseLeave={() => setHoveredMsg(null)}>
                          {!isMine && <Avatar url={activeThread.avatar_url} username={activeThread.username} size="xs" />}
                          {isMine && <div className="flex-1" />}
                          <div className="max-w-[75%]">
                            <div className="flex items-center gap-1.5 mb-px">
                              <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{isMine ? user.username : activeThread.username}</span>
                              <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{msg.body}</p>
                          </div>
                          {isMine && hoveredMsg === msg.id && (
                            <button onClick={() => deleteMessage(msg.id)} className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-2" style={{ color: 'var(--text-faint)' }}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <form onSubmit={sendMessage} className="px-3 py-2 shrink-0" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <input type="text" value={msgInput} onChange={(e) => setMsgInput(e.target.value)} placeholder="Message"
                    className="flex-1 px-3 py-2 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/50" style={inputStyle} />
                  <button type="submit" disabled={sending || !msgInput.trim()}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-500 text-white disabled:opacity-40 shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
