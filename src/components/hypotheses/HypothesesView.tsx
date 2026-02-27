import { useState } from 'react';
import { useInvestigationStore } from '../../store/investigationStore';
import { ENTITY_COLORS, ENTITY_TYPE_LABELS } from '../../types';
import type { Hypothesis } from '../../types';
import {
  Plus,
  X,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Lightbulb,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const STATUS_CONFIG = {
  active: { label: 'Active', icon: <Lightbulb size={14} />, color: '#4fc3f7' },
  confirmed: { label: 'Confirmée', icon: <CheckCircle size={14} />, color: '#4caf50' },
  refuted: { label: 'Réfutée', icon: <XCircle size={14} />, color: '#f44336' },
  suspended: { label: 'Suspendue', icon: <Pause size={14} />, color: '#ff9800' },
};

export default function HypothesesView() {
  const {
    investigation,
    addHypothesis,
    updateHypothesis,
    removeHypothesis,
    setSelectedEntity,
  } = useInvestigationStore();
  const { hypotheses, entities, links } = investigation;

  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    supportingEntityIds: [] as string[],
    supportingLinkIds: [] as string[],
    contradictingEntityIds: [] as string[],
    contradictingLinkIds: [] as string[],
  });

  const handleAddHypothesis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    addHypothesis({
      title: formData.title,
      description: formData.description,
      status: 'active',
      supportingEntityIds: formData.supportingEntityIds,
      supportingLinkIds: formData.supportingLinkIds,
      contradictingEntityIds: formData.contradictingEntityIds,
      contradictingLinkIds: formData.contradictingLinkIds,
    });
    setFormData({
      title: '',
      description: '',
      supportingEntityIds: [],
      supportingLinkIds: [],
      contradictingEntityIds: [],
      contradictingLinkIds: [],
    });
    setShowForm(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderEvidenceList = (
    entityIds: string[],
    linkIds: string[],
    type: 'support' | 'contradict',
  ) => {
    const relatedEntities = entities.filter((e) => entityIds.includes(e.id));
    const relatedLinks = links.filter((l) => linkIds.includes(l.id));
    const icon = type === 'support' ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />;
    const colorClass = type === 'support' ? 'evidence-support' : 'evidence-contradict';

    if (relatedEntities.length === 0 && relatedLinks.length === 0) {
      return (
        <div className={`evidence-empty ${colorClass}`}>
          <AlertTriangle size={14} />
          Aucun élément {type === 'support' ? 'de soutien' : 'contradictoire'}
        </div>
      );
    }

    return (
      <div className={`evidence-list ${colorClass}`}>
        {relatedEntities.map((e) => (
          <div
            key={e.id}
            className="evidence-item"
            onClick={() => setSelectedEntity(e.id)}
          >
            {icon}
            <span
              className="entity-dot"
              style={{ background: ENTITY_COLORS[e.type] }}
            />
            <span className="evidence-label">{e.label}</span>
            <span className="evidence-type">{ENTITY_TYPE_LABELS[e.type]}</span>
          </div>
        ))}
        {relatedLinks.map((l) => {
          const src = entities.find((e) => e.id === l.sourceId);
          const tgt = entities.find((e) => e.id === l.targetId);
          return (
            <div key={l.id} className="evidence-item">
              {icon}
              <span className="evidence-label">
                {src?.label} → {tgt?.label}: {l.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHypothesisCard = (h: Hypothesis) => {
    const isExpanded = expandedId === h.id;
    const config = STATUS_CONFIG[h.status];
    const supportCount = h.supportingEntityIds.length + h.supportingLinkIds.length;
    const contradictCount = h.contradictingEntityIds.length + h.contradictingLinkIds.length;
    const totalEvidence = supportCount + contradictCount;
    const supportPercent = totalEvidence > 0 ? (supportCount / totalEvidence) * 100 : 50;

    return (
      <div key={h.id} className={`hypothesis-card hypothesis-${h.status}`}>
        <div className="hypothesis-header" onClick={() => toggleExpand(h.id)}>
          <div className="hypothesis-expand">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          <div className="hypothesis-title-area">
            <h3>{h.title}</h3>
            <span
              className="hypothesis-status"
              style={{ color: config.color }}
            >
              {config.icon}
              {config.label}
            </span>
          </div>
          <div className="hypothesis-score">
            <div className="score-bar">
              <div
                className="score-fill support"
                style={{ width: `${supportPercent}%` }}
              />
              <div
                className="score-fill contradict"
                style={{ width: `${100 - supportPercent}%` }}
              />
            </div>
            <div className="score-numbers">
              <span className="text-success">{supportCount} pour</span>
              <span className="text-danger">{contradictCount} contre</span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="hypothesis-body">
            <p className="hypothesis-description">{h.description}</p>

            <div className="evidence-section">
              <h4>
                <ThumbsUp size={14} /> Éléments de soutien ({supportCount})
              </h4>
              {renderEvidenceList(h.supportingEntityIds, h.supportingLinkIds, 'support')}
            </div>

            <div className="evidence-section">
              <h4>
                <ThumbsDown size={14} /> Éléments contradictoires ({contradictCount})
              </h4>
              {renderEvidenceList(
                h.contradictingEntityIds,
                h.contradictingLinkIds,
                'contradict',
              )}
            </div>

            <div className="hypothesis-actions">
              <select
                value={h.status}
                onChange={(e) =>
                  updateHypothesis(h.id, {
                    status: e.target.value as Hypothesis['status'],
                  })
                }
                className="status-select"
              >
                {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => {
                  if (confirm(`Supprimer l'hypothèse "${h.title}" ?`))
                    removeHypothesis(h.id);
                }}
              >
                <X size={14} />
                Supprimer
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="view-container hypotheses-view">
      <div className="view-header">
        <h2>Hypothèses & Scénarios</h2>
        <div className="view-actions">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} />
            Hypothèse
          </button>
        </div>
      </div>

      <div className="hypotheses-info">
        <AlertTriangle size={16} />
        <p>
          Comparez les hypothèses. Un bon enquêteur teste activement chaque
          scénario pour éviter le biais de confirmation.
        </p>
      </div>

      {hypotheses.length === 0 ? (
        <div className="empty-state">
          <p>Aucune hypothèse formulée.</p>
          <p>
            Créez des hypothèses et liez-les aux preuves pour structurer votre
            raisonnement.
          </p>
        </div>
      ) : (
        <div className="hypotheses-list">
          {hypotheses.map((h) => renderHypothesisCard(h))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nouvelle hypothèse</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddHypothesis} className="modal-body">
              <div className="form-group">
                <label>Titre de l'hypothèse *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex : Dupont est l'auteur principal"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Décrivez le scénario en détail..."
                />
              </div>

              <div className="form-group">
                <label>Éléments de soutien</label>
                <select
                  multiple
                  value={formData.supportingEntityIds}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (o) => o.value,
                    );
                    setFormData({ ...formData, supportingEntityIds: selected });
                  }}
                  className="multi-select"
                >
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      [{ENTITY_TYPE_LABELS[e.type]}] {e.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Éléments contradictoires</label>
                <select
                  multiple
                  value={formData.contradictingEntityIds}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (o) => o.value,
                    );
                    setFormData({
                      ...formData,
                      contradictingEntityIds: selected,
                    });
                  }}
                  className="multi-select"
                >
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      [{ENTITY_TYPE_LABELS[e.type]}] {e.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
