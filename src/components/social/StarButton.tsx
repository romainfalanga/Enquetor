import { useState, useEffect } from 'react';
import { socialApi } from '../../lib/api/social';
import { useAuthStore } from '../../store/authStore';
import { Star } from 'lucide-react';

interface Props {
  investigationId: string;
  initialCount?: number;
}

export default function StarButton({ investigationId, initialCount = 0 }: Props) {
  const { user } = useAuthStore();
  const [starred, setStarred] = useState(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (user) {
      socialApi.isStarred(investigationId).then(setStarred).catch(() => {});
    }
  }, [investigationId, user]);

  const handleToggle = async () => {
    if (!user) return;
    try {
      const result = await socialApi.toggleStar(investigationId);
      setStarred(result);
      setCount((c) => c + (result ? 1 : -1));
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  return (
    <button
      className={`star-button ${starred ? 'starred' : ''}`}
      onClick={handleToggle}
      disabled={!user}
      title={starred ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Star size={16} fill={starred ? 'currentColor' : 'none'} />
      <span>{count}</span>
    </button>
  );
}
