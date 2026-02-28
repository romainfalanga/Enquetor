// ============================================
// Enquetor – Data Model
// ============================================

// --- Enums / Literal Types ---

export type EntityType =
  | 'person'
  | 'phone'
  | 'vehicle'
  | 'address'
  | 'account'
  | 'event'
  | 'evidence'
  | 'document'
  | 'media'
  | 'observation'
  | 'hypothesis';

export type LinkType =
  | 'calls'
  | 'met'
  | 'owner_of'
  | 'present_at'
  | 'seen_by'
  | 'linked_address'
  | 'contradicts'
  | 'source_of'
  | 'supports'
  | 'related'
  | 'communicates'
  | 'employed_by'
  | 'travels_to';

export type ConfidenceLevel = 'confirmed' | 'probable' | 'unverified';

export type InvestigationStatus = 'to_investigate' | 'validated' | 'refuted';

export type SourceType = 'pv' | 'audition' | 'video' | 'osint' | 'document' | 'testimony' | 'other';

// --- Provenance ---

export interface Provenance {
  sourceType: SourceType;
  sourceRef: string;       // e.g. "PV-2024-0042"
  importedBy: string;
  importedAt: string;      // ISO date
  integrity?: string;      // hash or note
}

// --- Entity (Node) ---

export interface Entity {
  id: string;
  type: EntityType;
  label: string;
  description: string;
  properties: Record<string, string>; // flexible key/value
  confidence: ConfidenceLevel;
  status: InvestigationStatus;
  provenance: Provenance;
  timestamp?: string;       // ISO date – when this entity is relevant
  coordinates?: { lat: number; lng: number };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// --- Link (Edge) ---

export interface Link {
  id: string;
  type: LinkType;
  sourceId: string;   // entity id
  targetId: string;   // entity id
  label: string;
  description: string;
  confidence: ConfidenceLevel;
  status: InvestigationStatus;
  provenance: Provenance;
  timestamp?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// --- Hypothesis ---

export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'confirmed' | 'refuted' | 'suspended';
  supportingEntityIds: string[];
  supportingLinkIds: string[];
  contradictingEntityIds: string[];
  contradictingLinkIds: string[];
  parentHypothesisId?: string; // for tree structure
  createdAt: string;
  updatedAt: string;
}

// --- Lead / Todo ---

export interface Lead {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'done' | 'dismissed';
  relatedEntityIds: string[];
  relatedLinkIds: string[];
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Investigation (root container) ---

export interface Investigation {
  id: string;
  name: string;
  description: string;
  entities: Entity[];
  links: Link[];
  hypotheses: Hypothesis[];
  leads: Lead[];
  createdAt: string;
  updatedAt: string;
}

// --- UI State ---

export type ViewType = 'graph' | 'timeline' | 'map' | 'hypotheses' | 'todos';

// --- Display helpers ---

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  person: 'Personne',
  phone: 'Téléphone',
  vehicle: 'Véhicule',
  address: 'Adresse',
  account: 'Compte',
  event: 'Événement',
  evidence: 'Pièce à conviction',
  document: 'Document',
  media: 'Image / Vidéo',
  observation: 'Fait observé',
  hypothesis: 'Hypothèse',
};

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  calls: 'Appelle',
  met: 'Rencontré le',
  owner_of: 'Propriétaire de',
  present_at: 'Présent à',
  seen_by: 'Vu par',
  linked_address: 'Même adresse',
  contradicts: 'Contredit',
  source_of: 'Source de',
  supports: 'Soutient',
  related: 'Lié à',
  communicates: 'Communique avec',
  employed_by: 'Employé par',
  travels_to: 'Se déplace vers',
};

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  confirmed: 'Confirmé',
  probable: 'Probable',
  unverified: 'Non vérifié',
};

export const STATUS_LABELS: Record<InvestigationStatus, string> = {
  to_investigate: 'À investiguer',
  validated: 'Validé',
  refuted: 'Réfuté',
};

export const ENTITY_COLORS: Record<EntityType, string> = {
  person: '#4fc3f7',
  phone: '#81c784',
  vehicle: '#ffb74d',
  address: '#e57373',
  account: '#ba68c8',
  event: '#fff176',
  evidence: '#ff8a65',
  document: '#a1887f',
  media: '#f06292',
  observation: '#4db6ac',
  hypothesis: '#7986cb',
};

export const ENTITY_ICONS: Record<EntityType, string> = {
  person: 'User',
  phone: 'Phone',
  vehicle: 'Car',
  address: 'MapPin',
  account: 'CreditCard',
  event: 'Calendar',
  evidence: 'Package',
  document: 'FileText',
  media: 'Camera',
  observation: 'Eye',
  hypothesis: 'HelpCircle',
};

// ============================================
// Social / Supabase Types
// ============================================

export type InvestigationVisibility = 'public' | 'private' | 'unlisted';

export type InvestigationCategory =
  | 'politics'
  | 'environment'
  | 'corporate'
  | 'justice'
  | 'health'
  | 'education'
  | 'media'
  | 'technology'
  | 'other';

export const CATEGORY_LABELS: Record<InvestigationCategory, string> = {
  politics: 'Politique',
  environment: 'Environnement',
  corporate: 'Entreprises',
  justice: 'Justice',
  health: 'Santé',
  education: 'Éducation',
  media: 'Médias',
  technology: 'Technologie',
  other: 'Autre',
};

export type MemberRole = 'owner' | 'admin' | 'contributor' | 'viewer';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  is_verified: boolean;
  created_at: string;
}

export interface InvestigationRow {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  visibility: InvestigationVisibility;
  category: InvestigationCategory;
  tags: string[];
  stars_count: number;
  fork_of: string | null;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export interface InvestigationMember {
  id: string;
  investigation_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  user?: Profile;
}

export interface Comment {
  id: string;
  investigation_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  author?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'star' | 'comment' | 'fork' | 'join' | 'mention';
  title: string;
  body: string;
  link: string;
  read: boolean;
  created_at: string;
}
