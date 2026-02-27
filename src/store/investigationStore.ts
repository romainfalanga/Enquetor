import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Entity,
  Link,
  Hypothesis,
  Lead,
  Investigation,
  ViewType,
  EntityType,
  ConfidenceLevel,
  InvestigationStatus,
} from '../types';

interface Filters {
  entityTypes: EntityType[];
  confidenceLevels: ConfidenceLevel[];
  statuses: InvestigationStatus[];
  dateFrom?: string;
  dateTo?: string;
  searchQuery: string;
}

interface InvestigationState {
  // Data
  investigation: Investigation;
  // UI
  activeView: ViewType;
  selectedEntityId: string | null;
  selectedLinkId: string | null;
  sidebarOpen: boolean;
  detailPanelOpen: boolean;
  filters: Filters;

  // Actions – Investigation
  setInvestigation: (inv: Investigation) => void;
  updateInvestigationMeta: (name: string, description: string) => void;

  // Actions – Entities
  addEntity: (entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  removeEntity: (id: string) => void;

  // Actions – Links
  addLink: (link: Omit<Link, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateLink: (id: string, updates: Partial<Link>) => void;
  removeLink: (id: string) => void;

  // Actions – Hypotheses
  addHypothesis: (h: Omit<Hypothesis, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateHypothesis: (id: string, updates: Partial<Hypothesis>) => void;
  removeHypothesis: (id: string) => void;

  // Actions – Leads
  addLead: (l: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  removeLead: (id: string) => void;

  // Actions – UI
  setActiveView: (view: ViewType) => void;
  setSelectedEntity: (id: string | null) => void;
  setSelectedLink: (id: string | null) => void;
  toggleSidebar: () => void;
  setDetailPanelOpen: (open: boolean) => void;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;

  // Selectors-like helpers
  getEntity: (id: string) => Entity | undefined;
  getLink: (id: string) => Link | undefined;
  getLinksForEntity: (entityId: string) => Link[];
  getFilteredEntities: () => Entity[];
  getFilteredLinks: () => Link[];

  // Import / Export
  exportData: () => string;
  importData: (json: string) => void;
}

const now = () => new Date().toISOString();

const DEFAULT_FILTERS: Filters = {
  entityTypes: [],
  confidenceLevels: [],
  statuses: [],
  searchQuery: '',
};

const createEmptyInvestigation = (): Investigation => ({
  id: uuidv4(),
  name: 'Nouvelle enquête',
  description: '',
  entities: [],
  links: [],
  hypotheses: [],
  leads: [],
  createdAt: now(),
  updatedAt: now(),
});

export const useInvestigationStore = create<InvestigationState>()(
  persist(
    (set, get) => ({
      investigation: createEmptyInvestigation(),
      activeView: 'graph',
      selectedEntityId: null,
      selectedLinkId: null,
      sidebarOpen: true,
      detailPanelOpen: false,
      filters: { ...DEFAULT_FILTERS },

      // --- Investigation ---
      setInvestigation: (inv) => set({ investigation: inv }),
      updateInvestigationMeta: (name, description) =>
        set((s) => ({
          investigation: { ...s.investigation, name, description, updatedAt: now() },
        })),

      // --- Entities ---
      addEntity: (entity) => {
        const id = uuidv4();
        const ts = now();
        set((s) => ({
          investigation: {
            ...s.investigation,
            entities: [...s.investigation.entities, { ...entity, id, createdAt: ts, updatedAt: ts }],
            updatedAt: ts,
          },
        }));
        return id;
      },
      updateEntity: (id, updates) =>
        set((s) => ({
          investigation: {
            ...s.investigation,
            entities: s.investigation.entities.map((e) =>
              e.id === id ? { ...e, ...updates, updatedAt: now() } : e,
            ),
            updatedAt: now(),
          },
        })),
      removeEntity: (id) =>
        set((s) => ({
          investigation: {
            ...s.investigation,
            entities: s.investigation.entities.filter((e) => e.id !== id),
            links: s.investigation.links.filter((l) => l.sourceId !== id && l.targetId !== id),
            updatedAt: now(),
          },
        })),

      // --- Links ---
      addLink: (link) => {
        const id = uuidv4();
        const ts = now();
        set((s) => ({
          investigation: {
            ...s.investigation,
            links: [...s.investigation.links, { ...link, id, createdAt: ts, updatedAt: ts }],
            updatedAt: ts,
          },
        }));
        return id;
      },
      updateLink: (id, updates) =>
        set((s) => ({
          investigation: {
            ...s.investigation,
            links: s.investigation.links.map((l) =>
              l.id === id ? { ...l, ...updates, updatedAt: now() } : l,
            ),
            updatedAt: now(),
          },
        })),
      removeLink: (id) =>
        set((s) => ({
          investigation: {
            ...s.investigation,
            links: s.investigation.links.filter((l) => l.id !== id),
            updatedAt: now(),
          },
        })),

      // --- Hypotheses ---
      addHypothesis: (h) => {
        const id = uuidv4();
        const ts = now();
        set((s) => ({
          investigation: {
            ...s.investigation,
            hypotheses: [...s.investigation.hypotheses, { ...h, id, createdAt: ts, updatedAt: ts }],
            updatedAt: ts,
          },
        }));
        return id;
      },
      updateHypothesis: (id, updates) =>
        set((s) => ({
          investigation: {
            ...s.investigation,
            hypotheses: s.investigation.hypotheses.map((h) =>
              h.id === id ? { ...h, ...updates, updatedAt: now() } : h,
            ),
            updatedAt: now(),
          },
        })),
      removeHypothesis: (id) =>
        set((s) => ({
          investigation: {
            ...s.investigation,
            hypotheses: s.investigation.hypotheses.filter((h) => h.id !== id),
            updatedAt: now(),
          },
        })),

      // --- Leads ---
      addLead: (l) => {
        const id = uuidv4();
        const ts = now();
        set((s) => ({
          investigation: {
            ...s.investigation,
            leads: [...s.investigation.leads, { ...l, id, createdAt: ts, updatedAt: ts }],
            updatedAt: ts,
          },
        }));
        return id;
      },
      updateLead: (id, updates) =>
        set((s) => ({
          investigation: {
            ...s.investigation,
            leads: s.investigation.leads.map((l) =>
              l.id === id ? { ...l, ...updates, updatedAt: now() } : l,
            ),
            updatedAt: now(),
          },
        })),
      removeLead: (id) =>
        set((s) => ({
          investigation: {
            ...s.investigation,
            leads: s.investigation.leads.filter((l) => l.id !== id),
            updatedAt: now(),
          },
        })),

      // --- UI ---
      setActiveView: (view) => set({ activeView: view }),
      setSelectedEntity: (id) => set({ selectedEntityId: id, selectedLinkId: null, detailPanelOpen: !!id }),
      setSelectedLink: (id) => set({ selectedLinkId: id, selectedEntityId: null, detailPanelOpen: !!id }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setDetailPanelOpen: (open) =>
        set({ detailPanelOpen: open, ...(open ? {} : { selectedEntityId: null, selectedLinkId: null }) }),
      setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
      resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

      // --- Helpers ---
      getEntity: (id) => get().investigation.entities.find((e) => e.id === id),
      getLink: (id) => get().investigation.links.find((l) => l.id === id),
      getLinksForEntity: (entityId) =>
        get().investigation.links.filter((l) => l.sourceId === entityId || l.targetId === entityId),

      getFilteredEntities: () => {
        const { investigation, filters } = get();
        return investigation.entities.filter((e) => {
          if (filters.entityTypes.length > 0 && !filters.entityTypes.includes(e.type)) return false;
          if (filters.confidenceLevels.length > 0 && !filters.confidenceLevels.includes(e.confidence))
            return false;
          if (filters.statuses.length > 0 && !filters.statuses.includes(e.status)) return false;
          if (filters.dateFrom && e.timestamp && e.timestamp < filters.dateFrom) return false;
          if (filters.dateTo && e.timestamp && e.timestamp > filters.dateTo) return false;
          if (
            filters.searchQuery &&
            !e.label.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
            !e.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
          )
            return false;
          return true;
        });
      },

      getFilteredLinks: () => {
        const { investigation, filters } = get();
        const filteredEntityIds = new Set(get().getFilteredEntities().map((e) => e.id));
        return investigation.links.filter((l) => {
          if (!filteredEntityIds.has(l.sourceId) || !filteredEntityIds.has(l.targetId)) return false;
          if (filters.confidenceLevels.length > 0 && !filters.confidenceLevels.includes(l.confidence))
            return false;
          if (filters.statuses.length > 0 && !filters.statuses.includes(l.status)) return false;
          return true;
        });
      },

      // --- Import / Export ---
      exportData: () => JSON.stringify(get().investigation, null, 2),
      importData: (json) => {
        try {
          const data = JSON.parse(json) as Investigation;
          set({ investigation: data });
        } catch {
          console.error('Invalid JSON import');
        }
      },
    }),
    {
      name: 'enquetor-investigation',
    },
  ),
);
