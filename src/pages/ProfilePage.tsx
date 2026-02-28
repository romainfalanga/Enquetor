import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { socialApi } from '../lib/api/social';
import InvestigationCard from '../components/social/InvestigationCard';
import type { Profile, InvestigationRow } from '../types';
import { User, Users, Star, Calendar, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, profile: myProfile, updateProfile } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [investigations, setInvestigations] = useState<InvestigationRow[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');

  const isOwnProfile = !username || (myProfile && username === myProfile.username);

  useEffect(() => {
    loadProfile();
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    setLoading(true);
    try {
      const targetProfile = isOwnProfile && myProfile
        ? myProfile
        : await socialApi.getProfile(username!);
      setProfile(targetProfile);

      const [invs, followerCount, followingCount] = await Promise.all([
        socialApi.getUserInvestigations(targetProfile.id),
        socialApi.getFollowerCount(targetProfile.id),
        socialApi.getFollowingCount(targetProfile.id),
      ]);

      setInvestigations(invs as InvestigationRow[]);
      setFollowers(followerCount);
      setFollowing(followingCount);

      if (user && !isOwnProfile) {
        const following = await socialApi.isFollowing(targetProfile.id);
        setIsFollowing(following);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    try {
      const result = await socialApi.toggleFollow(profile.id);
      setIsFollowing(result);
      setFollowers((c) => c + (result ? 1 : -1));
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ display_name: editDisplayName, bio: editBio });
      setProfile((p) => p ? { ...p, display_name: editDisplayName, bio: editBio } : p);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const startEditing = () => {
    setEditBio(profile?.bio || '');
    setEditDisplayName(profile?.display_name || '');
    setEditing(true);
  };

  if (loading) {
    return <div className="profile-page"><div className="profile-loading">Chargement...</div></div>;
  }

  if (!profile) {
    return <div className="profile-page"><div className="profile-not-found">Profil introuvable</div></div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header-card">
        <div className="profile-avatar">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name} />
          ) : (
            <User size={48} />
          )}
        </div>

        <div className="profile-info">
          {editing ? (
            <div className="profile-edit-form">
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Nom d'affichage"
              />
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Votre bio..."
                rows={3}
              />
              <div className="profile-edit-actions">
                <button className="btn btn-primary btn-sm" onClick={handleSaveProfile}>Sauvegarder</button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Annuler</button>
              </div>
            </div>
          ) : (
            <>
              <h1>{profile.display_name}</h1>
              <p className="profile-username">@{profile.username}</p>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              <div className="profile-stats">
                <span><Users size={14} /> {followers} abonnés</span>
                <span>{following} abonnements</span>
                <span><Star size={14} /> {investigations.length} enquêtes</span>
                <span><Calendar size={14} /> Membre depuis {format(new Date(profile.created_at), 'MMMM yyyy', { locale: fr })}</span>
              </div>
            </>
          )}
        </div>

        <div className="profile-actions">
          {isOwnProfile ? (
            <button className="btn btn-outline" onClick={startEditing}>
              <Settings size={16} /> Modifier
            </button>
          ) : (
            <button
              className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
              onClick={handleFollow}
            >
              {isFollowing ? 'Suivi' : 'Suivre'}
            </button>
          )}
        </div>
      </div>

      <section className="profile-investigations">
        <h2>Enquêtes publiques</h2>
        {investigations.length === 0 ? (
          <p className="text-muted">Aucune enquête publique</p>
        ) : (
          <div className="investigations-grid">
            {investigations.map((inv) => (
              <InvestigationCard key={inv.id} investigation={inv} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
