import { useState } from 'react';
import { useInvestigationStore } from '../../store/investigationStore';
import {
  LINK_TYPE_LABELS,
  CONFIDENCE_LABELS,
  STATUS_LABELS,
  ENTITY_COLORS,
} from '../../types';
import type {
  LinkType,
  ConfidenceLevel,
  InvestigationStatus,
  SourceType,
} from '../../types';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  preselectedSourceId?: string;
}

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  pv: 'Procès-verbal',
  audition: 'Audition',
  video: 'Vidéo',
  osint: 'OSINT',
  document: 'Document',
  testimony: 'Témoignage',
  other: 'Autre',
};

export default function LinkForm({ onClose, preselectedSourceId }: Props) {
  const { addLink, investigation } = useInvestigationStore();
  const entities = investigation.entities;

  const [form, setForm] = useState({
    type: 'related' as LinkType,
    sourceId: preselectedSourceId || '',
    targetId: '',
    label: '',
    description: '',
    confidence: 'unverified' as ConfidenceLevel,
    status: 'to_investigate' as InvestigationStatus,
    sourceType: 'pv' as SourceType,
    sourceRef: '',
    importedBy: '',
    timestamp: '',
    tags: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sourceId || !form.targetId || !form.label.trim()) return;

    addLink({
      type: form.type,
      sourceId: form.sourceId,
      targetId: form.targetId,
      label: form.label,
      description: form.description,
      confidence: form.confidence,
      status: form.status,
      provenance: {
        sourceType: form.sourceType,
        sourceRef: form.sourceRef,
        importedBy: form.importedBy || 'Utilisateur',
        importedAt: new Date().toISOString(),
      },
      timestamp: form.timestamp || undefined,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Ajouter un lien</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Entité source *</label>
            <select
              value={form.sourceId}
              onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
              required
            >
              <option value="">-- Choisir --</option>
              {entities.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type de lien *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as LinkType })}
              >
                {(Object.entries(LINK_TYPE_LABELS) as [LinkType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Entité cible *</label>
            <select
              value={form.targetId}
              onChange={(e) => setForm({ ...form, targetId: e.target.value })}
              required
            >
              <option value="">-- Choisir --</option>
              {entities
                .filter((ent) => ent.id !== form.sourceId)
                .map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.label}
                  </option>
                ))}
            </select>
          </div>

          {form.sourceId && form.targetId && (
            <div className="link-preview">
              {(() => {
                const src = entities.find((e) => e.id === form.sourceId);
                const tgt = entities.find((e) => e.id === form.targetId);
                return (
                  <>
                    <span className="entity-dot" style={{ background: src ? ENTITY_COLORS[src.type] : '#666' }} />
                    <span>{src?.label}</span>
                    <span className="link-arrow">→ {LINK_TYPE_LABELS[form.type]} →</span>
                    <span className="entity-dot" style={{ background: tgt ? ENTITY_COLORS[tgt.type] : '#666' }} />
                    <span>{tgt?.label}</span>
                  </>
                );
              })()}
            </div>
          )}

          <div className="form-group">
            <label>Libellé du lien *</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ex : Appel le 17 janvier"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Détails sur cette relation..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Confiance</label>
              <select
                value={form.confidence}
                onChange={(e) => setForm({ ...form, confidence: e.target.value as ConfidenceLevel })}
              >
                {(Object.entries(CONFIDENCE_LABELS) as [ConfidenceLevel, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as InvestigationStatus })}
              >
                {(Object.entries(STATUS_LABELS) as [InvestigationStatus, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Source</label>
              <select
                value={form.sourceType}
                onChange={(e) => setForm({ ...form, sourceType: e.target.value as SourceType })}
              >
                {(Object.entries(SOURCE_TYPE_LABELS) as [SourceType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group flex-2">
              <label>Référence</label>
              <input
                type="text"
                value={form.sourceRef}
                onChange={(e) => setForm({ ...form, sourceRef: e.target.value })}
                placeholder="PV-2025-..."
              />
            </div>
          </div>

          <div className="form-group">
            <label>Horodatage</label>
            <input
              type="datetime-local"
              value={form.timestamp}
              onChange={(e) => setForm({ ...form, timestamp: e.target.value })}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
