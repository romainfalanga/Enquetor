import { useInvestigationStore } from './store/investigationStore';
import Sidebar from './components/layout/Sidebar';
import FilterBar from './components/layout/FilterBar';
import DetailPanel from './components/shared/DetailPanel';
import GraphView from './components/graph/GraphView';
import TimelineView from './components/timeline/TimelineView';
import MapView from './components/map/MapView';
import HypothesesView from './components/hypotheses/HypothesesView';
import TodosView from './components/todos/TodosView';
import './App.css';

function App() {
  const { activeView, sidebarOpen, detailPanelOpen } = useInvestigationStore();

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
      <Sidebar />
      <main className="main-content">
        <FilterBar />
        <div className="content-area">
          {renderView()}
          {detailPanelOpen && <DetailPanel />}
        </div>
      </main>
    </div>
  );
}

export default App;
