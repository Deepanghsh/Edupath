import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { C, CARD } from './ui';

const typeIcon  = { drive: '🏢', system: '🔔', mentor: '🎓' };
const typeColor = { drive: C.accent, system: C.pending, mentor: '#7b4fa6' };

export default function NotificationsPage({ setUnreadCount }) {
  const [notifications, setNotifications] = useState([]);
  const [filter,        setFilter]        = useState('All');
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/student/notifications');
      setNotifications(data);
      setUnreadCount?.(data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Notifications fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/student/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount?.(prev => Math.max(0, (prev || 1) - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/student/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount?.(0);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const TYPES = ['All', 'drive', 'system', 'mentor'];
  const filtered   = notifications.filter(n => filter === 'All' || n.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return <div className="p-7 min-h-screen bg-[#f5f6f9] flex items-center justify-center"><div className="text-[#8d97aa] text-sm">Loading notifications...</div></div>;
  }

  return (
    <div className="p-5 md:p-7 bg-[#f5f6f9] min-h-screen">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[#0d1b3e] text-[22px] font-bold m-0 tracking-[-0.3px]">Notifications</h1>
          <p className="text-[#8d97aa] text-[12px] mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="px-3 py-1.5 text-[11px] font-semibold text-[#1e5fa8] bg-[#eef3fb] border border-[#b0c6e8] cursor-pointer hover:bg-[#dfeaf8] transition-all">
            ✓ Mark All Read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1 text-[11.5px] cursor-pointer transition-all border ${
              filter === t ? 'bg-[#0d1b3e] text-white border-[#0d1b3e]' : 'bg-white text-[#4f5d73] border-[#d8dce6] hover:bg-[#f5f6f9]'
            }`}>
            {t === 'All' ? 'All' : `${typeIcon[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={`${CARD} p-12 text-center`}>
          <div className="text-4xl mb-3">🔕</div>
          <p className="text-[#8d97aa] text-[13px]">No notifications in this category.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((n) => (
          <div key={n._id}
            className={`${CARD} p-4 flex items-start gap-4 border-l-[3px] transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-[1px] group`}
            style={{ borderLeftColor: n.read ? '#d8dce6' : typeColor[n.type] || C.accent, opacity: n.read ? 0.75 : 1 }}
            onClick={() => !n.read && markRead(n._id)}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 mt-0.5"
              style={{ background: n.read ? '#f5f6f9' : '#eef3fb', border: `1px solid ${n.read ? '#d8dce6' : '#b0c6e8'}` }}>
              {typeIcon[n.type] || '🔔'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="font-semibold text-[13px] text-[#0d1b3e]">
                  {!n.read && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1e5fa8] mr-1.5 mb-0.5" />}
                  {n.title}
                </div>
                <div className="text-[10.5px] text-[#8d97aa] shrink-0">{n.timestamp}</div>
              </div>
              <div className="text-[12px] text-[#4f5d73] mt-1 leading-relaxed">{n.message}</div>
              {!n.read && (
                <div className="text-[10px] text-[#8d97aa] mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Click to mark as read</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
