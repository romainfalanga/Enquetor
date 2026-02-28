import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../lib/api/notifications';
import type { Notification } from '../types';
import { Bell, Star, MessageCircle, GitFork, UserPlus, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const ICON_MAP: Record<string, React.ReactNode> = {
  star: <Star size={16} />,
  comment: <MessageCircle size={16} />,
  fork: <GitFork size={16} />,
  join: <UserPlus size={16} />,
  mention: <Bell size={16} />,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.list();
      setNotifications(data as Notification[]);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1><Bell size={24} /> Notifications</h1>
        <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
          <Check size={16} /> Tout marquer comme lu
        </button>
      </div>

      {loading ? (
        <div className="notifications-loading">Chargement...</div>
      ) : notifications.length === 0 ? (
        <div className="notifications-empty">
          <Bell size={40} />
          <p>Aucune notification</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              to={notification.link || '#'}
              className={`notification-item ${notification.read ? '' : 'unread'}`}
              onClick={() => !notification.read && handleMarkRead(notification.id)}
            >
              <div className="notification-icon">
                {ICON_MAP[notification.type] || <Bell size={16} />}
              </div>
              <div className="notification-content">
                <p className="notification-title">{notification.title}</p>
                <p className="notification-body">{notification.body}</p>
                <span className="notification-time">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                </span>
              </div>
              {!notification.read && <span className="notification-dot" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
