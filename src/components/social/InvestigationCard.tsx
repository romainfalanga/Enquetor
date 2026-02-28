import { Link } from 'react-router-dom';
import type { InvestigationRow, InvestigationCategory } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { Star, GitFork, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  investigation: InvestigationRow;
  compact?: boolean;
}

export default function InvestigationCard({ investigation, compact }: Props) {
  const categoryLabel = CATEGORY_LABELS[investigation.category as InvestigationCategory] || 'Autre';

  return (
    <Link
      to={`/investigation/${investigation.id}`}
      className={`investigation-card ${compact ? 'investigation-card-compact' : ''}`}
    >
      <div className="investigation-card-header">
        <span className="investigation-card-category">{categoryLabel}</span>
        {investigation.fork_of && <GitFork size={12} className="fork-indicator" />}
      </div>

      <h3 className="investigation-card-title">{investigation.name}</h3>

      {!compact && investigation.description && (
        <p className="investigation-card-desc">{investigation.description}</p>
      )}

      <div className="investigation-card-footer">
        {investigation.owner && (
          <span className="investigation-card-author">
            {investigation.owner.display_name}
          </span>
        )}
        <div className="investigation-card-stats">
          <span><Star size={12} /> {investigation.stars_count || 0}</span>
          <span>
            <Calendar size={12} />{' '}
            {formatDistanceToNow(new Date(investigation.updated_at), { addSuffix: true, locale: fr })}
          </span>
        </div>
      </div>
    </Link>
  );
}
