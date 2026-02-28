import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { notificationsApi } from '../../lib/api/notifications';
import { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  Search,
  Home,
  Compass,
  Bell,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';

export default function AppNavbar() {
  const { user, profile } = useAuthStore();
  const signOut = useAuthStore((s) => s.signOut);
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (user && configured) {
      notificationsApi.getUnreadCount().then(setUnread).catch(() => {});
      const interval = setInterval(() => {
        notificationsApi.getUnreadCount().then(setUnread).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, configured]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="app-navbar">
      <Link to="/" className="navbar-brand">
        <Search size={22} />
        <span className="navbar-brand-name">Enquetor</span>
      </Link>

      <div className="navbar-links">
        <Link to="/" className={`navbar-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
          <Home size={18} />
          <span>Accueil</span>
        </Link>
        <Link to="/explore" className={`navbar-link ${isActive('/explore') ? 'active' : ''}`}>
          <Compass size={18} />
          <span>Explorer</span>
        </Link>
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            <Link to="/notifications" className={`navbar-icon-btn ${unread > 0 ? 'has-notification' : ''}`}>
              <Bell size={20} />
              {unread > 0 && <span className="notification-badge">{unread}</span>}
            </Link>
            <Link to={`/profile/${profile?.username || ''}`} className="navbar-avatar">
              <User size={18} />
            </Link>
            <button className="navbar-icon-btn" onClick={signOut} title="Déconnexion">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">
            <LogIn size={14} /> Connexion
          </Link>
        )}
      </div>
    </nav>
  );
}
