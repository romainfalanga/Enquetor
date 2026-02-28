import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { socialApi } from '../../lib/api/social';
import type { Comment } from '../../types';
import { Send, User, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  investigationId: string;
  comments: Comment[];
  onNewComment: (comment: Comment) => void;
}

export default function CommentsThread({ investigationId, comments, onNewComment }: Props) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setSending(true);
    try {
      const comment = await socialApi.addComment(investigationId, content.trim());
      onNewComment(comment as Comment);
      setContent('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await socialApi.deleteComment(id);
      // Parent should handle removing from state, for now just reload
      window.location.reload();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="comments-thread">
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="comments-empty">Aucun commentaire. Soyez le premier à contribuer !</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="comment-avatar">
                {comment.author?.avatar_url ? (
                  <img src={comment.author.avatar_url} alt="" />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className="comment-body">
                <div className="comment-header">
                  <Link to={`/profile/${comment.author?.username}`} className="comment-author">
                    {comment.author?.display_name || 'Anonyme'}
                  </Link>
                  <span className="comment-time">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                  </span>
                  {user && comment.user_id === user.id && (
                    <button
                      className="comment-delete"
                      onClick={() => handleDelete(comment.id)}
                      title="Supprimer"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {user ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ajouter un commentaire..."
            disabled={sending}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !content.trim()}>
            <Send size={14} />
          </button>
        </form>
      ) : (
        <p className="comments-login-prompt">
          <Link to="/login">Connectez-vous</Link> pour commenter
        </p>
      )}
    </div>
  );
}
