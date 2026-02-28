import { useState } from 'react';
import { useInvestigationStore } from '../../store/investigationStore';
import {
  ENTITY_TYPE_LABELS,
  LINK_TYPE_LABELS,
  CONFIDENCE_LABELS,
  STATUS_LABELS,
  ENTITY_COLORS,
} from '../../types';
import { X, Tag, Shield, Clock, FileText, Link2, Trash2, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import EntityForm from './EntityForm';

export default function DetailPanel() {
  const {
    selectedEntityId,
    selectedLinkId,
    detailPanelOpen,
    setDetailPanelOpen,
    investigation,
    getLinksForEntity,
    removeEntity,
    removeLink,
    setSelectedEntity,
  } = useInvestigationStore();

  const [showEditForm, setShowEditForm] = useState(false);

  if (!detailPanelOpen) return null;

  const entity = selectedEntityId
    ? investigation.entities.find((e) => e.id === selectedEntityId)
    : null;
  const link = selectedLinkId
    ? investigation.links.find((l) => l.id === selectedLinkId)
    : null;

  if (!entity && !link) return null;

  const formatDate = (iso?: string) => {
    if (!iso) return '\u2014';
    try {
      return format(new Date(iso), 'dd MMM yyyy HH:mm', { locale: fr });
    } catch {
      return iso;
    }
  };

  const entityLinks = entity ? getLinksForEntity(entity.id) : [];

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h3>
          {entity ? (
            <>
              <span
                className="entity-dot"
                style={{ background: ENTITY_COLORS[entity.type] }}
              />
              {entity.label}
            </>
          ) : link ? (
            link.label
          ) : null}
        </h3>
        <button className="btn-icon" onClick={() => setDetailPanelOpen(false)}>
          <X size={18} />
        </button>
      </div>

      <div className="detail-body">
        {entity && (
          <>
            <div className="detail-meta">
              <span className="badge badge-type">{ENTITY_TYPE_LABELS[entity.type]}</span>
              <span className={`badge badge-confidence badge-${entity.confidence}`}>
                <Shield size={12} />
                {CONFIDENCE_LABELS[entity.confidence]}
              </span>
              <span className={`badge badge-status badge-${entity.status}`}>
                {STATUS_LABELS[entity.status]}
              </span>
            </div>

            <p className="detail-description">{entity.description}</p>

            {Object.keys(entity.properties).length > 0 && (
              <div className="detail-section">
                <h4>Propri\u00e9t\u00e9s</h4>
                <dl className="properties-list">
                  {Object.entries(entity.properties).map(([key, val]) => (
                    <div key={key} className="property-item">
                      <dt>{key}</dt>
                      <dd>{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {entity.tags.length > 0 && (
              <div className="detail-section">
                <h4><Tag size={14} /> Tags</h4>
                <div className="tag-list">
                  {entity.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-section">
              <h4><FileText size={14} /> Provenance</h4>
              <div className="provenance-info">
                <div><strong>Source :</strong> {entity.provenance.sourceRef}</div>
                <div><strong>Type :</strong> {entity.provenance.sourceType}</div>
                <div><strong>Import\u00e9 par :</strong> {entity.provenance.importedBy}</div>
                <div><strong>Date :</strong> {formatDate(entity.provenance.importedAt)}</div>
              </div>
            </div>

            {entity.timestamp && (
              <div className="detail-section">
                <h4><Clock size={14} /> Horodatage</h4>
                <p>{formatDate(entity.timestamp)}</p>
              </div>
            )}

            {entityLinks.length > 0 && (
              <div className="detail-section">
                <h4><Link2 size={14} /> Relations ({entityLinks.length})</h4>
                <ul className="relations-list">
                  {entityLinks.map((l) => {
                    const otherId = l.sourceId === entity.id ? l.targetId : l.sourceId;
                    const other = investigation.entities.find((e) => e.id === otherId);
                    return (
                      <li
                        key={l.id}
                        className="relation-item"
                        onClick={() => {
                          if (other) setSelectedEntity(other.id);
                        }}
                      >
                        <span className="relation-type">{LINK_TYPE_LABELS[l.type]}</span>
                        <span className="relation-target">{other?.label || otherId}</span>
                        <span className={`badge badge-confidence badge-${l.confidence} small`}>
                          {CONFIDENCE_LABELS[l.confidence]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="detail-actions">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setShowEditForm(true)}
              >
                <Edit3 size={14} />
                Modifier
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => {
                  if (confirm(`Supprimer "${entity.label}" et tous ses liens ?`)) {
                    removeEntity(entity.id);
                    setDetailPanelOpen(false);
                  }
                }}
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            </div>
          </>
        )}

        {link && (
          <>
            <div className="detail-meta">
              <span className="badge badge-type">{LINK_TYPE_LABELS[link.type]}</span>
              <span className={`badge badge-confidence badge-${link.confidence}`}>
                <Shield size={12} />
                {CONFIDENCE_LABELS[link.confidence]}
              </span>
              <span className={`badge badge-status badge-${link.status}`}>
                {STATUS_LABELS[link.status]}
              </span>
            </div>

            <p className="detail-description">{link.description}</p>

            <div className="detail-section">
              <h4>Entit\u00e9s reli\u00e9es</h4>
              <div className="linked-entities">
                {[link.sourceId, link.targetId].map((eid) => {
                  const ent = investigation.entities.find((e) => e.id === eid);
                  return ent ? (
                    <button
                      key={eid}
                      className="linked-entity-btn"
                      onClick={() => setSelectedEntity(ent.id)}
                    >
                      <span className="entity-dot" style={{ background: ENTITY_COLORS[ent.type] }} />
                      {ent.label}
                    </button>
                  ) : null;
                })}
              </div>
            </div>

            <div className="detail-section">
              <h4><FileText size={14} /> Provenance</h4>
              <div className="provenance-info">
                <div><strong>Source :</strong> {link.provenance.sourceRef}</div>
                <div><strong>Type :</strong> {link.provenance.sourceType}</div>
                <div><strong>Import\u00e9 par :</strong> {link.provenance.importedBy}</div>
                <div><strong>Date :</strong> {formatDate(link.provenance.importedAt)}</div>
              </div>
            </div>

            <div className="detail-actions">
              <button
                className="btn btn-sm btn-danger"
                onClick={() => {
                  if (confirm('Supprimer ce lien ?')) {
                    removeLink(link.id);
                    setDetailPanelOpen(false);
                  }
                }}
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            </div>
          </>
        )}
      </div>

      {showEditForm && entity && (
        <EntityForm
          editEntity={entity}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}
