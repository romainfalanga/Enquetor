import { useInvestigationStore } from '../../store/investigationStore';
import {
  ENTITY_TYPE_LABELS,
  CONFIDENCE_LABELS,
  STATUS_LABELS,
} from '../../types';
import type { EntityType, ConfidenceLevel, InvestigationStatus } from '../../types';
import { Search, X, Filter } from 'lucide-react';
import { useState } from 'react';

export default function FilterBar() {
  const { filters, setFilters, resetFilters } = useInvestigationStore();
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    filters.entityTypes.length > 0 ||
    filters.confidenceLevels.length > 0 ||
    filters.statuses.length > 0 ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.searchQuery;

  const toggleEntityType = (t: EntityType) => {
    const types = filters.entityTypes.includes(t)
      ? filters.entityTypes.filter((x) => x !== t)
      : [...filters.entityTypes, t];
    setFilters({ entityTypes: types });
  };

  const toggleConfidence = (c: ConfidenceLevel) => {
    const levels = filters.confidenceLevels.includes(c)
      ? filters.confidenceLevels.filter((x) => x !== c)
      : [...filters.confidenceLevels, c];
    setFilters({ confidenceLevels: levels });
  };

  const toggleStatus = (s: InvestigationStatus) => {
    const sts = filters.statuses.includes(s)
      ? filters.statuses.filter((x) => x !== s)
      : [...filters.statuses, s];
    setFilters({ statuses: sts });
  };

  return (
    <div className="filter-bar">
      <div className="filter-bar-main">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
          />
          {filters.searchQuery && (
            <button className="btn-icon" onClick={() => setFilters({ searchQuery: '' })}>
              <X size={14} />
            </button>
          )}
        </div>
        <button
          className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={14} />
          Filtres
          {hasActiveFilters && <span className="badge">{
            filters.entityTypes.length + filters.confidenceLevels.length + filters.statuses.length
          }</span>}
        </button>
        {hasActiveFilters && (
          <button className="btn btn-sm btn-ghost" onClick={resetFilters}>
            <X size={14} />
            Effacer
          </button>
        )}
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Type d'entité</label>
            <div className="filter-chips">
              {(Object.keys(ENTITY_TYPE_LABELS) as EntityType[]).map((t) => (
                <button
                  key={t}
                  className={`chip ${filters.entityTypes.includes(t) ? 'active' : ''}`}
                  onClick={() => toggleEntityType(t)}
                >
                  {ENTITY_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Niveau de confiance</label>
            <div className="filter-chips">
              {(Object.keys(CONFIDENCE_LABELS) as ConfidenceLevel[]).map((c) => (
                <button
                  key={c}
                  className={`chip ${filters.confidenceLevels.includes(c) ? 'active' : ''}`}
                  onClick={() => toggleConfidence(c)}
                >
                  {CONFIDENCE_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Statut</label>
            <div className="filter-chips">
              {(Object.keys(STATUS_LABELS) as InvestigationStatus[]).map((s) => (
                <button
                  key={s}
                  className={`chip ${filters.statuses.includes(s) ? 'active' : ''}`}
                  onClick={() => toggleStatus(s)}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group filter-dates">
            <label>Période</label>
            <div className="date-inputs">
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ dateFrom: e.target.value || undefined })}
              />
              <span>→</span>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ dateTo: e.target.value || undefined })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
