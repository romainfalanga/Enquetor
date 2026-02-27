import { useState } from 'react';
import { useInvestigationStore } from '../../store/investigationStore';
import {
  ENTITY_TYPE_LABELS,
  CONFIDENCE_LABELS,
  STATUS_LABELS,
} from '../../types';
import type {
  EntityType,
  ConfidenceLevel,
  InvestigationStatus,
  SourceType,
} from '../../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface Props {
  onClose: () => void;
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

export default function EntityForm({ onClose }: Props) {
  const addEntity = useInvestigationStore((s) => s.addEntity);

  const [form, setForm] = useState({
    type: 'person' as EntityType,
    label: '',
    description: '',
    confidence: 'unverified' as ConfidenceLevel,
    status: 'to_investigate' as InvestigationStatus,
    sourceType: 'pv' as SourceType,
    sourceRef: '',
    importedBy: '',
    lat: '',
    lng: '',
    timestamp: '',
    tags: '' as string,
  });
  const [properties, setProperties] = useState<{ key: string; value: string }[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) return;

    const props: Record<string, string> = {};
    properties.forEach(({ key, value }) => {
      if (key.trim()) props[key.trim()] = value;
    });

    addEntity({
      type: form.type,
      label: form.label,
      description: form.description,
      properties: props,
      confidence: form.confidence,
      status: form.status,
      provenance: {
        sourceType: form.sourceType,
        sourceRef: form.sourceRef,
        importedBy: form.importedBy || 'Utilisateur',
        importedAt: new Date().toISOString(),
      },
      timestamp: form.timestamp || undefined,
      coordinates:
        form.lat && form.lng
          ? { lat: parseFloat(form.lat), lng: parseFloat(form.lng) }
          : undefined,
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
          <h3>Ajouter une entité</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as EntityType })}
              >
                {(Object.entries(ENTITY_TYPE_LABELS) as [EntityType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group flex-2">
              <label>Libellé *</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Ex : Jean Dupont, +33 6 12..."
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Description détaillée..."
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
              <label>Type de source</label>
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
              <label>Référence source</label>
              <input
                type="text"
                value={form.sourceRef}
                onChange={(e) => setForm({ ...form, sourceRef: e.target.value })}
                placeholder="Ex : PV-2025-0042"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Importé par</label>
              <input
                type="text"
                value={form.importedBy}
                onChange={(e) => setForm({ ...form, importedBy: e.target.value })}
                placeholder="Votre nom"
              />
            </div>
            <div className="form-group">
              <label>Horodatage</label>
              <input
                type="datetime-local"
                value={form.timestamp}
                onChange={(e) => setForm({ ...form, timestamp: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                placeholder="48.8566"
              />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                placeholder="2.3522"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tags (séparés par des virgules)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="suspect, prioritaire, ..."
            />
          </div>

          <div className="form-group">
            <label>
              Propriétés supplémentaires
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setProperties([...properties, { key: '', value: '' }])}
              >
                <Plus size={14} />
              </button>
            </label>
            {properties.map((p, i) => (
              <div key={i} className="form-row property-row">
                <input
                  type="text"
                  placeholder="Clé"
                  value={p.key}
                  onChange={(e) => {
                    const updated = [...properties];
                    updated[i].key = e.target.value;
                    setProperties(updated);
                  }}
                />
                <input
                  type="text"
                  placeholder="Valeur"
                  value={p.value}
                  onChange={(e) => {
                    const updated = [...properties];
                    updated[i].value = e.target.value;
                    setProperties(updated);
                  }}
                />
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setProperties(properties.filter((_, j) => j !== i))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
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
