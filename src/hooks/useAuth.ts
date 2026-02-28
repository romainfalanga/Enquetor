import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    user: store.user,
    profile: store.profile,
    loading: store.loading,
    isAuthenticated: !!store.user,
    signUp: store.signUp,
    signIn: store.signIn,
    signOut: store.signOut,
    updateProfile: store.updateProfile,
  };
}
