import { useMemo, useState } from 'react';
import { useInvestigationStore } from '../../store/investigationStore';
import {
  ENTITY_TYPE_LABELS,
  ENTITY_COLORS,
  CONFIDENCE_LABELS,
} from '../../types';
import type { Entity } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Filter } from 'lucide-react';
import EntityForm from '../shared/EntityForm';

interface TimelineItem {
  id: string;
  date: Date;
  label: string;
  description: string;
  type: 'entity' | 'link';
  entityType?: Entity['type'];
  confidence: string;
  relatedPersons: string[];
}

export default function TimelineView() {
  const { getFilteredEntities, getFilteredLinks, investigation, setSelectedEntity, setSelectedLink } =
    useInvestigationStore();
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [personFilter, setPersonFilter] = useState<string[]>([]);

  const persons = investigation.entities.filter((e) => e.type === 'person');

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];
    const entities = getFilteredEntities();
    const links = getFilteredLinks();

    // Add entities with timestamps
    entities.forEach((e) => {
      if (!e.timestamp) return;
      const relatedLinks = investigation.links.filter(
        (l) => l.sourceId === e.id || l.targetId === e.id,
      );
      const relatedPersonIds = new Set<string>();
      relatedLinks.forEach((l) => {
        const otherId = l.sourceId === e.id ? l.targetId : l.sourceId;
        const other = investigation.entities.find((ent) => ent.id === otherId);
        if (other?.type === 'person') relatedPersonIds.add(other.id);
      });
      if (e.type === 'person') relatedPersonIds.add(e.id);

      items.push({
        id: e.id,
        date: new Date(e.timestamp),
        label: e.label,
        description: e.description,
        type: 'entity',
        entityType: e.type,
        confidence: e.confidence,
        relatedPersons: [...relatedPersonIds],
      });
    });

    // Add links with timestamps
    links.forEach((l) => {
      if (!l.timestamp) return;
      const src = investigation.entities.find((e) => e.id === l.sourceId);
      const tgt = investigation.entities.find((e) => e.id === l.targetId);
      const relatedPersonIds = new Set<string>();
      if (src?.type === 'person') relatedPersonIds.add(src.id);
      if (tgt?.type === 'person') relatedPersonIds.add(tgt.id);

      items.push({
        id: l.id,
        date: new Date(l.timestamp),
        label: l.label,
        description: `${src?.label || '?'} → ${tgt?.label || '?'}: ${l.description}`,
        type: 'link',
        confidence: l.confidence,
        relatedPersons: [...relatedPersonIds],
      });
    });

    // Filter by person
    const filtered =
      personFilter.length > 0
        ? items.filter((item) =>
            personFilter.some((pid) => item.relatedPersons.includes(pid)),
          )
        : items;

    return filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [getFilteredEntities, getFilteredLinks, investigation, personFilter]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    timelineItems.forEach((item) => {
      const key = format(item.date, 'yyyy-MM-dd');
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [timelineItems]);

  const togglePerson = (id: string) => {
    setPersonFilter((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  return (
    <div className="view-container timeline-view">
      <div className="view-header">
        <h2>Chronologie</h2>
        <div className="view-actions">
          <button className="btn btn-sm btn-primary" onClick={() => setShowEntityForm(true)}>
            <Plus size={14} />
            Événement
          </button>
        </div>
      </div>

      {persons.length > 0 && (
        <div className="person-filter-bar">
          <Filter size={14} />
          <span className="filter-label">Filtrer par personne :</span>
          {persons.map((p) => (
            <button
              key={p.id}
              className={`chip ${personFilter.includes(p.id) ? 'active' : ''}`}
              onClick={() => togglePerson(p.id)}
              style={
                personFilter.includes(p.id)
                  ? { background: ENTITY_COLORS.person, color: '#000' }
                  : {}
              }
            >
              {p.label}
            </button>
          ))}
          {personFilter.length > 0 && (
            <button className="btn btn-sm btn-ghost" onClick={() => setPersonFilter([])}>
              Tous
            </button>
          )}
        </div>
      )}

      {timelineItems.length === 0 ? (
        <div className="empty-state">
          <p>Aucun événement horodaté à afficher.</p>
          <p>Ajoutez des entités et des liens avec un horodatage pour les voir ici.</p>
        </div>
      ) : (
        <div className="timeline-container">
          <div className="timeline-line" />
          {Object.entries(groupedByDate).map(([dateKey, items]) => (
            <div key={dateKey} className="timeline-day">
              <div className="timeline-date-header">
                {format(new Date(dateKey), 'EEEE d MMMM yyyy', { locale: fr })}
              </div>
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`timeline-item timeline-item-${item.type}`}
                  onClick={() => {
                    if (item.type === 'entity') setSelectedEntity(item.id);
                    else setSelectedLink(item.id);
                  }}
                >
                  <div className="timeline-dot" style={{
                    background: item.entityType ? ENTITY_COLORS[item.entityType] : '#7986cb',
                  }} />
                  <div className="timeline-content">
                    <div className="timeline-time">
                      {format(item.date, 'HH:mm', { locale: fr })}
                    </div>
                    <div className="timeline-item-header">
                      {item.entityType && (
                        <span className="badge badge-sm" style={{
                          background: ENTITY_COLORS[item.entityType] + '33',
                          color: ENTITY_COLORS[item.entityType],
                        }}>
                          {ENTITY_TYPE_LABELS[item.entityType]}
                        </span>
                      )}
                      <strong>{item.label}</strong>
                      <span className={`badge badge-confidence badge-${item.confidence} badge-sm`}>
                        {CONFIDENCE_LABELS[item.confidence as keyof typeof CONFIDENCE_LABELS]}
                      </span>
                    </div>
                    <p className="timeline-description">{item.description}</p>
                    {item.relatedPersons.length > 0 && (
                      <div className="timeline-persons">
                        {item.relatedPersons.map((pid) => {
                          const person = investigation.entities.find((e) => e.id === pid);
                          return person ? (
                            <span key={pid} className="person-tag">
                              {person.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showEntityForm && <EntityForm onClose={() => setShowEntityForm(false)} />}
    </div>
  );
}
