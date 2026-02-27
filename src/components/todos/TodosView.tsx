import { useState, useMemo } from 'react';
import { useInvestigationStore } from '../../store/investigationStore';
import { ENTITY_COLORS } from '../../types';
import type { Lead } from '../../types';
import {
  Plus,
  X,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Zap,
} from 'lucide-react';

const PRIORITY_CONFIG = {
  high: { label: 'Haute', icon: <ArrowUp size={14} />, color: '#f44336' },
  medium: { label: 'Moyenne', icon: <ArrowRight size={14} />, color: '#ff9800' },
  low: { label: 'Basse', icon: <ArrowDown size={14} />, color: '#4caf50' },
};

const STATUS_CONFIG = {
  open: { label: 'Ouverte', icon: <AlertCircle size={14} />, color: '#4fc3f7' },
  in_progress: { label: 'En cours', icon: <Clock size={14} />, color: '#ff9800' },
  done: { label: 'Terminée', icon: <CheckCircle size={14} />, color: '#4caf50' },
  dismissed: { label: 'Écartée', icon: <XCircle size={14} />, color: '#666' },
};

export default function TodosView() {
  const {
    investigation,
    addLead,
    updateLead,
    removeLead,
    setSelectedEntity,
  } = useInvestigationStore();
  const { leads, entities, links } = investigation;

  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Lead['status'][]>(['open', 'in_progress']);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Lead['priority'],
    assignedTo: '',
    relatedEntityIds: [] as string[],
  });

  // Generate automatic suggestions based on graph analysis
  const suggestions = useMemo(() => {
    const sugg: string[] = [];

    // Find entities with "to_investigate" status
    const toInvestigate = entities.filter((e) => e.status === 'to_investigate');
    if (toInvestigate.length > 0) {
      sugg.push(
        `${toInvestigate.length} entité(s) avec statut "À investiguer" : ${toInvestigate.map((e) => e.label).join(', ')}`,
      );
    }

    // Find unverified links
    const unverifiedLinks = links.filter((l) => l.confidence === 'unverified');
    if (unverifiedLinks.length > 0) {
      sugg.push(
        `${unverifiedLinks.length} lien(s) non vérifiés nécessitant confirmation`,
      );
    }

    // Find isolated entities (no links)
    const connectedIds = new Set(
      links.flatMap((l) => [l.sourceId, l.targetId]),
    );
    const isolated = entities.filter((e) => !connectedIds.has(e.id));
    if (isolated.length > 0) {
      sugg.push(
        `${isolated.length} entité(s) isolée(s) sans lien : ${isolated.map((e) => e.label).join(', ')}`,
      );
    }

    // Find persons not linked to events
    const persons = entities.filter((e) => e.type === 'person');
    const events = entities.filter((e) => e.type === 'event');
    persons.forEach((p) => {
      const personLinks = links.filter(
        (l) => l.sourceId === p.id || l.targetId === p.id,
      );
      const linkedToEvent = personLinks.some((l) => {
        const otherId = l.sourceId === p.id ? l.targetId : l.sourceId;
        return events.some((ev) => ev.id === otherId);
      });
      if (!linkedToEvent && events.length > 0) {
        sugg.push(
          `Vérifier le lien entre "${p.label}" et les événements de l'enquête`,
        );
      }
    });

    return sugg;
  }, [entities, links]);

  const filteredLeads = useMemo(
    () =>
      statusFilter.length > 0
        ? leads.filter((l) => statusFilter.includes(l.status))
        : leads,
    [leads, statusFilter],
  );

  const sortedLeads = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const statusOrder = { in_progress: 0, open: 1, done: 2, dismissed: 3 };
    return [...filteredLeads].sort(
      (a, b) =>
        statusOrder[a.status] - statusOrder[b.status] ||
        priorityOrder[a.priority] - priorityOrder[b.priority],
    );
  }, [filteredLeads]);

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    addLead({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: 'open',
      relatedEntityIds: formData.relatedEntityIds,
      relatedLinkIds: [],
      assignedTo: formData.assignedTo || undefined,
    });
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assignedTo: '',
      relatedEntityIds: [],
    });
    setShowForm(false);
  };

  const toggleStatusFilter = (s: Lead['status']) => {
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  return (
    <div className="view-container todos-view">
      <div className="view-header">
        <h2>Pistes & Actions</h2>
        <div className="view-actions">
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} />
            Piste
          </button>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions-panel">
          <div className="suggestions-header">
            <Zap size={16} />
            <h3>Suggestions automatiques</h3>
          </div>
          <ul className="suggestions-list">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="status-filter-bar">
        {(Object.entries(STATUS_CONFIG) as [Lead['status'], typeof STATUS_CONFIG.open][]).map(
          ([key, config]) => {
            const count = leads.filter((l) => l.status === key).length;
            return (
              <button
                key={key}
                className={`chip ${statusFilter.includes(key) ? 'active' : ''}`}
                onClick={() => toggleStatusFilter(key)}
                style={
                  statusFilter.includes(key)
                    ? { background: config.color + '33', color: config.color, borderColor: config.color }
                    : {}
                }
              >
                {config.icon}
                {config.label} ({count})
              </button>
            );
          },
        )}
      </div>

      {sortedLeads.length === 0 ? (
        <div className="empty-state">
          <p>Aucune piste à afficher.</p>
          <p>Créez des pistes pour suivre les actions à mener.</p>
        </div>
      ) : (
        <div className="leads-list">
          {sortedLeads.map((lead) => {
            const priorityConf = PRIORITY_CONFIG[lead.priority];
            const statusConf = STATUS_CONFIG[lead.status];
            const relatedEnts = entities.filter((e) =>
              lead.relatedEntityIds.includes(e.id),
            );

            return (
              <div key={lead.id} className={`lead-card lead-${lead.status}`}>
                <div className="lead-header">
                  <div className="lead-priority" style={{ color: priorityConf.color }}>
                    {priorityConf.icon}
                  </div>
                  <div className="lead-title-area">
                    <h4>{lead.title}</h4>
                    {lead.assignedTo && (
                      <span className="lead-assignee">{lead.assignedTo}</span>
                    )}
                  </div>
                  <div className="lead-status-badge" style={{ color: statusConf.color }}>
                    {statusConf.icon}
                    {statusConf.label}
                  </div>
                </div>
                <p className="lead-description">{lead.description}</p>

                {relatedEnts.length > 0 && (
                  <div className="lead-related">
                    {relatedEnts.map((e) => (
                      <button
                        key={e.id}
                        className="related-entity-chip"
                        onClick={() => setSelectedEntity(e.id)}
                      >
                        <span
                          className="entity-dot"
                          style={{ background: ENTITY_COLORS[e.type] }}
                        />
                        {e.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="lead-actions">
                  <select
                    value={lead.status}
                    onChange={(e) =>
                      updateLead(lead.id, {
                        status: e.target.value as Lead['status'],
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
                  <select
                    value={lead.priority}
                    onChange={(e) =>
                      updateLead(lead.id, {
                        priority: e.target.value as Lead['priority'],
                      })
                    }
                    className="priority-select"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (confirm(`Supprimer la piste "${lead.title}" ?`))
                        removeLead(lead.id);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nouvelle piste</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="modal-body">
              <div className="form-group">
                <label>Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex : Vérifier alibi de X"
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
                  placeholder="Actions concrètes à mener..."
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priorité</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as Lead['priority'],
                      })
                    }
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigné à</label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedTo: e.target.value })
                    }
                    placeholder="Nom de l'enquêteur"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Entités liées</label>
                <select
                  multiple
                  value={formData.relatedEntityIds}
                  onChange={(e) => {
                    const selected = Array.from(
                      e.target.selectedOptions,
                      (o) => o.value,
                    );
                    setFormData({ ...formData, relatedEntityIds: selected });
                  }}
                  className="multi-select"
                >
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.label}
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
