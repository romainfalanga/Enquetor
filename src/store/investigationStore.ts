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
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

  // Supabase
  supabaseId: string | null;
  loadFromSupabase: (investigationId: string) => Promise<void>;
  saveToSupabase: () => Promise<void>;
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
      supabaseId: null,
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
          if (filters.searchQuery) {
            const q = filters.searchQuery.toLowerCase();
            const matchLabel = e.label.toLowerCase().includes(q);
            const matchDesc = e.description.toLowerCase().includes(q);
            const matchTags = e.tags.some(t => t.toLowerCase().includes(q));
            const matchProps = Object.values(e.properties).some(v => v.toLowerCase().includes(q));
            if (!matchLabel && !matchDesc && !matchTags && !matchProps) return false;
          }
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

      // --- Supabase ---
      loadFromSupabase: async (investigationId: string) => {
        if (!isSupabaseConfigured()) return;

        try {
          const [
            { data: inv },
            { data: entities },
            { data: links },
            { data: hypotheses },
            { data: leads },
          ] = await Promise.all([
            supabase.from('investigations').select('*').eq('id', investigationId).single(),
            supabase.from('entities').select('*').eq('investigation_id', investigationId).order('created_at'),
            supabase.from('links').select('*').eq('investigation_id', investigationId).order('created_at'),
            supabase.from('hypotheses').select('*').eq('investigation_id', investigationId).order('created_at'),
            supabase.from('leads').select('*').eq('investigation_id', investigationId).order('created_at'),
          ]);

          if (inv) {
            // Map snake_case DB rows to camelCase local types
            const mappedEntities: Entity[] = (entities || []).map((e: Record<string, unknown>) => ({
              id: e.id as string,
              type: e.type as Entity['type'],
              label: (e.label as string) || '',
              description: (e.description as string) || '',
              properties: (e.properties as Record<string, string>) || {},
              confidence: e.confidence as Entity['confidence'],
              status: e.status as Entity['status'],
              provenance: (e.provenance as Entity['provenance']) || { sourceType: 'other', sourceRef: '', importedBy: '', importedAt: now() },
              timestamp: e.timestamp as string | undefined,
              coordinates: e.coordinates as Entity['coordinates'],
              tags: (e.tags as string[]) || [],
              createdAt: e.created_at as string,
              updatedAt: e.updated_at as string,
            }));

            const mappedLinks: Link[] = (links || []).map((l: Record<string, unknown>) => ({
              id: l.id as string,
              type: l.type as Link['type'],
              sourceId: l.source_id as string,
              targetId: l.target_id as string,
              label: (l.label as string) || '',
              description: (l.description as string) || '',
              confidence: l.confidence as Link['confidence'],
              status: l.status as Link['status'],
              provenance: (l.provenance as Link['provenance']) || { sourceType: 'other', sourceRef: '', importedBy: '', importedAt: now() },
              timestamp: l.timestamp as string | undefined,
              tags: (l.tags as string[]) || [],
              createdAt: l.created_at as string,
              updatedAt: l.updated_at as string,
            }));

            const mappedHypotheses: Hypothesis[] = (hypotheses || []).map((h: Record<string, unknown>) => ({
              id: h.id as string,
              title: (h.title as string) || '',
              description: (h.description as string) || '',
              status: (h.status as Hypothesis['status']) || 'active',
              supportingEntityIds: (h.supporting_entity_ids as string[]) || [],
              supportingLinkIds: (h.supporting_link_ids as string[]) || [],
              contradictingEntityIds: (h.contradicting_entity_ids as string[]) || [],
              contradictingLinkIds: (h.contradicting_link_ids as string[]) || [],
              parentHypothesisId: h.parent_hypothesis_id as string | undefined,
              createdAt: h.created_at as string,
              updatedAt: h.updated_at as string,
            }));

            const mappedLeads: Lead[] = (leads || []).map((l: Record<string, unknown>) => ({
              id: l.id as string,
              title: (l.title as string) || '',
              description: (l.description as string) || '',
              priority: (l.priority as Lead['priority']) || 'medium',
              status: (l.status as Lead['status']) || 'open',
              relatedEntityIds: (l.related_entity_ids as string[]) || [],
              relatedLinkIds: (l.related_link_ids as string[]) || [],
              assignedTo: l.assigned_to as string | undefined,
              dueDate: l.due_date as string | undefined,
              createdAt: l.created_at as string,
              updatedAt: l.updated_at as string,
            }));

            set({
              investigation: {
                id: inv.id,
                name: inv.name,
                description: inv.description || '',
                entities: mappedEntities,
                links: mappedLinks,
                hypotheses: mappedHypotheses,
                leads: mappedLeads,
                createdAt: inv.created_at,
                updatedAt: inv.updated_at,
              },
              supabaseId: investigationId,
            });
          }
        } catch (err) {
          console.error('Failed to load from Supabase:', err);
        }
      },

      saveToSupabase: async () => {
        const { investigation, supabaseId } = get();
        if (!isSupabaseConfigured() || !supabaseId) return;

        try {
          await supabase
            .from('investigations')
            .update({ name: investigation.name, description: investigation.description, updated_at: now() })
            .eq('id', supabaseId);
        } catch (err) {
          console.error('Failed to save to Supabase:', err);
        }
      },
    }),
    {
      name: 'enquetor-investigation',
    },
  ),
);
