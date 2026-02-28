import { useInvestigationStore } from '../../store/investigationStore';
import { ENTITY_COLORS, ENTITY_TYPE_LABELS } from '../../types';
import type { ViewType, EntityType } from '../../types';
import {
  Network,
  Clock,
  Map,
  Lightbulb,
  CheckSquare,
  ChevronRight,
  Download,
  Upload,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import { useRef, useMemo } from 'react';
import { demoInvestigation } from '../../data/demoData';

const NAV_ITEMS: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'graph', label: 'Graphe', icon: <Network size={20} /> },
  { view: 'timeline', label: 'Chronologie', icon: <Clock size={20} /> },
  { view: 'map', label: 'Carte', icon: <Map size={20} /> },
  { view: 'hypotheses', label: 'Hypotheses', icon: <Lightbulb size={20} /> },
  { view: 'todos', label: 'Pistes', icon: <CheckSquare size={20} /> },
];

export default function Sidebar() {
  const {
    activeView,
    setActiveView,
    sidebarOpen,
    toggleSidebar,
    investigation,
    exportData,
    importData,
    setInvestigation,
  } = useInvestigationStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Entity type counts for quick overview
  const entityStats = useMemo(() => {
    const counts: Partial<Record<EntityType, number>> = {};
    investigation.entities.forEach((e) => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return Object.entries(counts) as [EntityType, number][];
  }, [investigation.entities]);

  const handleNavClick = (view: ViewType) => {
    setActiveView(view);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024 && sidebarOpen) {
      toggleSidebar();
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${investigation.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      importData(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoadDemo = () => {
    setInvestigation(demoInvestigation);
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        {sidebarOpen && (
          <div className="sidebar-brand">
            <Network size={24} className="brand-icon" />
            <span className="brand-name">Enquetor</span>
          </div>
        )}
        <button
          className="btn-icon"
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Fermer' : 'Ouvrir'}
          style={{ display: 'flex' }}
        >
          {sidebarOpen ? <X size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="investigation-info">
          <h3>{investigation.name}</h3>
          <p className="text-muted">{investigation.entities.length} entit&eacute;s · {investigation.links.length} liens</p>
        </div>
      )}

      {/* Quick entity stats for investigator overview */}
      {sidebarOpen && entityStats.length > 0 && (
        <div className="sidebar-stats">
          {entityStats.map(([type, count]) => (
            <span
              key={type}
              className="stat-chip"
              style={{
                background: ENTITY_COLORS[type] + '22',
                color: ENTITY_COLORS[type],
              }}
            >
              {count} {ENTITY_TYPE_LABELS[type]}
            </span>
          ))}
        </div>
      )}

      {/* Desktop navigation (hidden on mobile via CSS, bottom nav used instead) */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ view, label, icon }) => (
          <button
            key={view}
            className={`nav-item ${activeView === view ? 'active' : ''}`}
            onClick={() => handleNavClick(view)}
            title={label}
          >
            {icon}
            {sidebarOpen && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {sidebarOpen && (
        <div className="sidebar-actions">
          <button className="btn btn-sm btn-outline" onClick={handleLoadDemo}>
            <Plus size={14} />
            Donn&eacute;es d&eacute;mo
          </button>
          <button className="btn btn-sm btn-outline" onClick={handleExport}>
            <Download size={14} />
            Exporter
          </button>
          <button className="btn btn-sm btn-outline" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} />
            Importer
          </button>
          <button
            className="btn btn-sm btn-outline btn-danger"
            onClick={() => {
              if (confirm('R\u00e9initialiser l\'enqu\u00eate ? Toutes les donn\u00e9es seront perdues.')) {
                setInvestigation({
                  id: crypto.randomUUID(),
                  name: 'Nouvelle enqu\u00eate',
                  description: '',
                  entities: [],
                  links: [],
                  hypotheses: [],
                  leads: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
              }
            }}
          >
            <RotateCcw size={14} />
            R&eacute;initialiser
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </aside>
  );
}
