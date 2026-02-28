import { useEffect } from 'react';
import { useInvestigationStore } from './store/investigationStore';
import Sidebar from './components/layout/Sidebar';
import FilterBar from './components/layout/FilterBar';
import DetailPanel from './components/shared/DetailPanel';
import GraphView from './components/graph/GraphView';
import TimelineView from './components/timeline/TimelineView';
import MapView from './components/map/MapView';
import HypothesesView from './components/hypotheses/HypothesesView';
import TodosView from './components/todos/TodosView';
import type { ViewType } from './types';
import {
  Network,
  Clock,
  Map,
  Lightbulb,
  CheckSquare,
  Menu,
} from 'lucide-react';
import './App.css';

const MOBILE_NAV_ITEMS: { view: ViewType; label: string; icon: React.ReactNode }[] = [
  { view: 'graph', label: 'Graphe', icon: <Network size={20} /> },
  { view: 'timeline', label: 'Chrono', icon: <Clock size={20} /> },
  { view: 'map', label: 'Carte', icon: <Map size={20} /> },
  { view: 'hypotheses', label: 'Hypo.', icon: <Lightbulb size={20} /> },
  { view: 'todos', label: 'Pistes', icon: <CheckSquare size={20} /> },
];

function App() {
  const {
    activeView,
    sidebarOpen,
    detailPanelOpen,
    toggleSidebar,
    setActiveView,
  } = useInvestigationStore();

  // Close sidebar on mobile on initial load
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 1023px)').matches;
    if (isMobile && useInvestigationStore.getState().sidebarOpen) {
      useInvestigationStore.getState().toggleSidebar();
    }
  }, []);

  const handleMobileNavClick = (view: ViewType) => {
    setActiveView(view);
    if (sidebarOpen && window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'graph':
        return <GraphView />;
      case 'timeline':
        return <TimelineView />;
      case 'map':
        return <MapView />;
      case 'hypotheses':
        return <HypothesesView />;
      case 'todos':
        return <TodosView />;
      default:
        return <GraphView />;
    }
  };

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Sidebar backdrop for mobile overlay */}
      <div className="sidebar-backdrop" onClick={toggleSidebar} />

      <Sidebar />
      <main className="main-content">
        <FilterBar />
        <div className="content-area">
          {renderView()}
          {detailPanelOpen && <DetailPanel />}
        </div>
      </main>

      {/* Mobile bottom navigation */}
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
        <button
          className="mobile-nav-item"
          onClick={toggleSidebar}
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
