import { useEffect, useRef, useCallback, useState } from 'react';
import cytoscape from 'cytoscape';
import { useInvestigationStore } from '../../store/investigationStore';
import { ENTITY_COLORS } from '../../types';
import { Plus, Link2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import EntityForm from '../shared/EntityForm';
import LinkForm from '../shared/LinkForm';

export default function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const {
    getFilteredEntities,
    getFilteredLinks,
    setSelectedEntity,
    setSelectedLink,
    selectedEntityId,
  } = useInvestigationStore();

  const [showEntityForm, setShowEntityForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);

  const entities = getFilteredEntities();
  const links = getFilteredLinks();

  const buildElements = useCallback(() => {
    const nodes = entities.map((e) => ({
      data: {
        id: e.id,
        label: e.label,
        type: e.type,
        confidence: e.confidence,
        status: e.status,
        color: ENTITY_COLORS[e.type],
      },
    }));

    const edges = links.map((l) => ({
      data: {
        id: l.id,
        source: l.sourceId,
        target: l.targetId,
        label: l.label,
        type: l.type,
        confidence: l.confidence,
      },
    }));

    return [...nodes, ...edges];
  }, [entities, links]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: buildElements(),
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            label: 'data(label)',
            color: '#e0e0e0',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'font-size': '11px',
            'text-margin-y': 8,
            width: 40,
            height: 40,
            'border-width': 2,
            'border-color': '#333',
            'text-max-width': '120px',
            'text-wrap': 'ellipsis',
            'text-outline-color': '#1a1a2e',
            'text-outline-width': 2,
          } as cytoscape.Css.Node,
        },
        {
          selector: 'node[confidence = "unverified"]',
          style: {
            'border-style': 'dashed',
            'border-color': '#ff9800',
          } as cytoscape.Css.Node,
        },
        {
          selector: 'node[status = "refuted"]',
          style: {
            opacity: 0.4,
          } as cytoscape.Css.Node,
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#fff',
            width: 50,
            height: 50,
          } as cytoscape.Css.Node,
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#555',
            'target-arrow-color': '#555',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '9px',
            color: '#999',
            'text-rotation': 'autorotate',
            'text-outline-color': '#1a1a2e',
            'text-outline-width': 2,
          } as cytoscape.Css.Edge,
        },
        {
          selector: 'edge[confidence = "confirmed"]',
          style: {
            'line-color': '#4caf50',
            'target-arrow-color': '#4caf50',
            width: 3,
          } as cytoscape.Css.Edge,
        },
        {
          selector: 'edge[confidence = "probable"]',
          style: {
            'line-color': '#ff9800',
            'target-arrow-color': '#ff9800',
          } as cytoscape.Css.Edge,
        },
        {
          selector: 'edge[confidence = "unverified"]',
          style: {
            'line-color': '#f44336',
            'target-arrow-color': '#f44336',
            'line-style': 'dashed',
          } as cytoscape.Css.Edge,
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 500,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 120,
        gravity: 0.3,
      } as cytoscape.CoseLayoutOptions,
      minZoom: 0.2,
      maxZoom: 3,
    });

    cy.on('tap', 'node', (evt) => {
      const nodeId = evt.target.id();
      setSelectedEntity(nodeId);
    });

    cy.on('tap', 'edge', (evt) => {
      const edgeId = evt.target.id();
      setSelectedLink(edgeId);
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedEntity(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [buildElements, setSelectedEntity, setSelectedLink]);

  // Highlight selected node
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().removeClass('highlighted');
    if (selectedEntityId) {
      const node = cy.getElementById(selectedEntityId);
      if (node.length) {
        node.addClass('highlighted');
      }
    }
  }, [selectedEntityId]);

  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() / 1.3);
  const handleFit = () => cyRef.current?.fit(undefined, 50);

  return (
    <div className="view-container graph-view">
      <div className="view-header">
        <h2>Graphe d'enquête</h2>
        <div className="view-actions">
          <button className="btn btn-sm btn-primary" onClick={() => setShowEntityForm(true)}>
            <Plus size={14} />
            Entit&eacute;
          </button>
          <button className="btn btn-sm btn-outline" onClick={() => setShowLinkForm(true)}>
            <Link2 size={14} />
            Lien
          </button>
        </div>
      </div>

      <div className="graph-toolbar">
        <button className="btn-icon" onClick={handleZoomIn} title="Zoom +"><ZoomIn size={18} /></button>
        <button className="btn-icon" onClick={handleZoomOut} title="Zoom -"><ZoomOut size={18} /></button>
        <button className="btn-icon" onClick={handleFit} title="Ajuster"><Maximize2 size={18} /></button>
        <div className="legend">
          <span className="legend-item">
            <span className="legend-line" style={{ borderColor: '#4caf50' }} /> Confirmé
          </span>
          <span className="legend-item">
            <span className="legend-line" style={{ borderColor: '#ff9800' }} /> Probable
          </span>
          <span className="legend-item">
            <span className="legend-line legend-dashed" style={{ borderColor: '#f44336' }} /> Non vérifié
          </span>
        </div>
      </div>

      <div ref={containerRef} className="graph-container" />

      {entities.length === 0 && (
        <div className="empty-state">
          <p>Aucune entité dans le graphe.</p>
          <p>Ajoutez des entités et des liens, ou chargez les données démo depuis la barre latérale.</p>
        </div>
      )}

      {showEntityForm && <EntityForm onClose={() => setShowEntityForm(false)} />}
      {showLinkForm && <LinkForm onClose={() => setShowLinkForm(false)} />}
    </div>
  );
}
