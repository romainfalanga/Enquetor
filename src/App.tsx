import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { isSupabaseConfigured } from './lib/supabase';
import AppNavbar from './components/social/AppNavbar';
import AuthGuard from './components/auth/AuthGuard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import InvestigationPage from './pages/InvestigationPage';
import NotificationsPage from './pages/NotificationsPage';
import WorkPage from './pages/WorkPage';
import './App.css';

function AppContent() {
  const configured = isSupabaseConfigured();
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    if (configured) {
      initialize();
    }
  }, [configured]); // eslint-disable-line react-hooks/exhaustive-deps

  // If Supabase is not configured, go directly to the work page (offline mode)
  if (!configured) {
    return (
      <Routes>
        <Route path="*" element={<WorkPage />} />
      </Routes>
    );
  }

  return (
    <>
      <AppNavbar />
      <div className="page-container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/investigation/:id" element={<InvestigationPage />} />
          <Route path="/investigation/:id/work" element={
            <AuthGuard><WorkPage /></AuthGuard>
          } />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/notifications" element={
            <AuthGuard><NotificationsPage /></AuthGuard>
          } />
          <Route path="/" element={
            <AuthGuard><HomePage /></AuthGuard>
          } />
          <Route path="/work" element={<WorkPage />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
