import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { investigationsApi } from '../lib/api/investigations';
import { socialApi } from '../lib/api/social';
import CommentsThread from '../components/social/CommentsThread';
import StarButton from '../components/social/StarButton';
import type { InvestigationRow, Profile, Comment } from '../types';
import { CATEGORY_LABELS, type InvestigationCategory } from '../types';
import {
  Users,
  GitFork,
  Calendar,
  Eye,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Share2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function InvestigationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [investigation, setInvestigation] = useState<InvestigationRow | null>(null);
  const [members, setMembers] = useState<{ user?: Profile; role: string }[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadInvestigation();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInvestigation = async () => {
    setLoading(true);
    try {
      const [inv, membersList, commentsList] = await Promise.all([
        investigationsApi.getById(id!),
        socialApi.getMembers(id!),
        socialApi.getComments(id!),
      ]);
      setInvestigation(inv as InvestigationRow);
      setMembers(membersList as { user?: Profile; role: string }[]);
      setComments(commentsList as Comment[]);

      if (user) {
        const member = await socialApi.isMember(id!);
        setIsMember(member);
      }
    } catch (err) {
      console.error('Failed to load investigation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      await socialApi.joinInvestigation(id!);
      setIsMember(true);
      loadInvestigation();
    } catch (err) {
      console.error('Failed to join:', err);
    }
  };

  const handleLeave = async () => {
    try {
      await socialApi.leaveInvestigation(id!);
      setIsMember(false);
      loadInvestigation();
    } catch (err) {
      console.error('Failed to leave:', err);
    }
  };

  const handleFork = async () => {
    try {
      const forked = await investigationsApi.fork(id!);
      navigate(`/investigation/${forked.id}/work`);
    } catch (err) {
      console.error('Failed to fork:', err);
    }
  };

  const handleNewComment = (comment: Comment) => {
    setComments((prev) => [...prev, comment]);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (loading) {
    return <div className="investigation-page"><div className="page-loading">Chargement...</div></div>;
  }

  if (!investigation) {
    return <div className="investigation-page"><div className="page-not-found">Enquête introuvable</div></div>;
  }

  const isOwner = user && investigation.owner_id === user.id;

  return (
    <div className="investigation-page">
      <div className="page-nav">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Retour
        </button>
      </div>

      <div className="investigation-hero">
        <div className="investigation-hero-content">
          <div className="investigation-category-badge">
            {CATEGORY_LABELS[investigation.category as InvestigationCategory] || 'Autre'}
          </div>
          <h1>{investigation.name}</h1>
          <p className="investigation-description">{investigation.description}</p>

          <div className="investigation-meta">
            {investigation.owner && (
              <Link to={`/profile/${investigation.owner.username}`} className="investigation-author">
                <span className="author-avatar"><Users size={14} /></span>
                {investigation.owner.display_name}
              </Link>
            )}
            <span><Calendar size={14} /> {format(new Date(investigation.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
            <span><Eye size={14} /> {investigation.visibility}</span>
            <span><Users size={14} /> {members.length} enquêteurs</span>
          </div>

          <div className="investigation-actions-bar">
            <StarButton investigationId={investigation.id} initialCount={investigation.stars_count} />

            {user && !isOwner && (
              isMember ? (
                <button className="btn btn-outline btn-sm" onClick={handleLeave}>
                  <UserMinus size={16} /> Quitter
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={handleJoin}>
                  <UserPlus size={16} /> Rejoindre
                </button>
              )
            )}

            {user && (
              <button className="btn btn-outline btn-sm" onClick={handleFork}>
                <GitFork size={16} /> Fork
              </button>
            )}

            {(isOwner || isMember) && (
              <Link to={`/investigation/${investigation.id}/work`} className="btn btn-primary btn-sm">
                Ouvrir l'éditeur
              </Link>
            )}

            <button className="btn btn-ghost btn-sm" onClick={handleShare}>
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="investigation-content-grid">
        <div className="investigation-main">
          <section className="investigation-members-section">
            <h2>Enquêteurs ({members.length})</h2>
            <div className="members-list">
              {members.map((m, i) => (
                <Link
                  key={i}
                  to={`/profile/${m.user?.username}`}
                  className="member-chip"
                >
                  <span className="member-avatar"><Users size={14} /></span>
                  {m.user?.display_name || 'Anonyme'}
                  {m.role === 'owner' && <span className="member-role-badge">Créateur</span>}
                </Link>
              ))}
            </div>
          </section>

          <section className="investigation-comments-section">
            <h2>Discussion ({comments.length})</h2>
            <CommentsThread
              investigationId={investigation.id}
              comments={comments}
              onNewComment={handleNewComment}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
