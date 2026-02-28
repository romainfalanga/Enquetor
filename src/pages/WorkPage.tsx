import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useInvestigationStore } from '../store/investigationStore';
import { isSupabaseConfigured } from '../lib/supabase';
import Sidebar from '../components/layout/Sidebar';
import FilterBar from '../components/layout/FilterBar';
import DetailPanel from '../components/shared/DetailPanel';
import GraphView from '../components/graph/GraphView';
import TimelineView from '../components/timeline/TimelineView';
import MapView from '../components/map/MapView';
import HypothesesView from '../components/hypotheses/HypothesesView';
import TodosView from '../components/todos/TodosView';
import type { ViewType } from '../types';
import {
  Network,
  Clock,
  Map,
  Lightbulb,
  CheckSquare,
  Menu,
} from 'lucide-react';

const MOBILE_NAV_ITEMS: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'graph', label: 'Graphe', icon: <Network size={20} /> },
  { view: 'timeline', label: 'Chrono', icon: <Clock size={20} /> },
  { view: 'map', label: 'Carte', icon: <Map size={20} /> },
  { view: 'hypotheses', label: 'Hypo.', icon: <Lightbulb size={20} /> },
  { view: 'todos', label: 'Pistes', icon: <CheckSquare size={20} /> },
];

export default function WorkPage() {
  const { id } = useParams<{ id: string }>();
  const {
    activeView,
    sidebarOpen,
    detailPanelOpen,
    toggleSidebar,
    setActiveView,
    loadFromSupabase,
  } = useInvestigationStore();

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (isMobile && useInvestigationStore.getState().sidebarOpen) {
      useInvestigationStore.getState().toggleSidebar();
    }
  }, []);

  useEffect(() => {
    if (id && isSupabaseConfigured()) {
      loadFromSupabase(id);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMobileNavClick = (view: ViewType) => {
    setActiveView(view);
    if (sidebarOpen && window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'graph': return <GraphView />;
      case 'timeline': return <TimelineView />;
      case 'map': return <MapView />;
      case 'hypotheses': return <HypothesesView />;
      case 'todos': return <TodosView />;
      default: return <GraphView />;
    }
  };

  return (
    <div className={`app work-page ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <div className="sidebar-backdrop" onClick={toggleSidebar} />
      <Sidebar />
      <main className="main-content">
        <FilterBar />
        <div className="content-area">
          {renderView()}
          {detailPanelOpen && <DetailPanel />}
        </div>
      </main>

      <nav className="mobile-bottom-nav">
        {MOBILE_NAV_ITEMS.map(({ view, label, icon }) => (
          <button
            key={view}
            className={`mobile-nav-item ${activeView === view ? 'active' : ''}`}
            onClick={() => handleMobileNavClick(view)}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
        <button className="mobile-nav-item" onClick={toggleSidebar}>
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}
