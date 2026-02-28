import { supabase } from '../supabase';
import type { InvestigationRow, InvestigationCategory, InvestigationVisibility } from '../../types';

export const investigationsApi = {
  async list(filter: 'mine' | 'shared' | 'public' | 'starred' = 'public') {
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase.from('investigations').select(`
      *,
      owner:profiles!owner_id(id, username, display_name, avatar_url),
      members:investigation_members(count)
    `);

    if (filter === 'mine' && user) {
      query = query.eq('owner_id', user.id);
    } else if (filter === 'shared' && user) {
      const { data: memberIds } = await supabase
        .from('investigation_members')
        .select('investigation_id')
        .eq('user_id', user.id);
      if (memberIds) {
        query = query.neq('owner_id', user.id)
          .in('id', memberIds.map(m => m.investigation_id));
      }
    } else if (filter === 'starred' && user) {
      const { data: starredIds } = await supabase
        .from('stars')
        .select('investigation_id')
        .eq('user_id', user.id);
      if (starredIds) {
        query = query.in('id', starredIds.map(s => s.investigation_id));
      }
    } else {
      query = query.eq('visibility', 'public');
    }

    const { data, error } = await query.order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('investigations')
      .select(`
        *,
        owner:profiles!owner_id(id, username, display_name, avatar_url, is_verified)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(data: { name: string; description: string; visibility?: InvestigationVisibility; category?: InvestigationCategory }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: investigation, error } = await supabase
      .from('investigations')
      .insert({ ...data, owner_id: user.id })
      .select()
      .single();
    if (error) throw error;

    // Add owner as member
    await supabase.from('investigation_members').insert({
      investigation_id: investigation.id,
      user_id: user.id,
      role: 'owner',
    });

    return investigation;
  },

  async update(id: string, data: Partial<InvestigationRow>) {
    const { data: updated, error } = await supabase
      .from('investigations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  },

  async delete(id: string) {
    const { error } = await supabase.from('investigations').delete().eq('id', id);
    if (error) throw error;
  },

  async fork(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get original investigation with all data
    const original = await this.getById(id);
    const [
      { data: entities },
      { data: links },
      { data: hypotheses },
      { data: leads },
    ] = await Promise.all([
      supabase.from('entities').select('*').eq('investigation_id', id),
      supabase.from('links').select('*').eq('investigation_id', id),
      supabase.from('hypotheses').select('*').eq('investigation_id', id),
      supabase.from('leads').select('*').eq('investigation_id', id),
    ]);

    // Create forked investigation
    const forked = await this.create({
      name: `${original.name} (fork)`,
      description: original.description,
      visibility: 'public',
      category: original.category,
    });

    // Update fork_of
    await supabase.from('investigations').update({ fork_of: id }).eq('id', forked.id);

    // Copy entities with ID mapping
    const entityIdMap = new Map<string, string>();
    if (entities?.length) {
      for (const e of entities) {
        const { id: oldId, investigation_id: _, created_by: __, ...rest } = e;
        const { data: newEntity } = await supabase
          .from('entities')
          .insert({ ...rest, investigation_id: forked.id, created_by: user.id })
          .select()
          .single();
        if (newEntity) entityIdMap.set(oldId, newEntity.id);
      }
    }

    // Copy links with remapped IDs
    if (links?.length) {
      for (const l of links) {
        const { id: _, investigation_id: __, created_by: ___, source_id, target_id, ...rest } = l;
        const newSource = entityIdMap.get(source_id);
        const newTarget = entityIdMap.get(target_id);
        if (newSource && newTarget) {
          await supabase.from('links').insert({
            ...rest,
            investigation_id: forked.id,
            source_id: newSource,
            target_id: newTarget,
            created_by: user.id,
          });
        }
      }
    }

    // Copy hypotheses and leads (simplified, no ID remapping for referenced arrays)
    if (hypotheses?.length) {
      for (const h of hypotheses) {
        const { id: _, investigation_id: __, created_by: ___, ...rest } = h;
        await supabase.from('hypotheses').insert({
          ...rest,
          investigation_id: forked.id,
          created_by: user.id,
        });
      }
    }

    if (leads?.length) {
      for (const l of leads) {
        const { id: _, investigation_id: __, created_by: ___, ...rest } = l;
        await supabase.from('leads').insert({
          ...rest,
          investigation_id: forked.id,
          created_by: user.id,
        });
      }
    }

    return forked;
  },

  async getExplore(options: { category?: string; sort?: 'recent' | 'popular' | 'active'; search?: string } = {}) {
    let query = supabase
      .from('investigations')
      .select(`
        *,
        owner:profiles!owner_id(id, username, display_name, avatar_url)
      `)
      .eq('visibility', 'public');

    if (options.category && options.category !== 'all') {
      query = query.eq('category', options.category);
    }
    if (options.search) {
      query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    switch (options.sort) {
      case 'popular':
        query = query.order('stars_count', { ascending: false });
        break;
      case 'active':
        query = query.order('updated_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;
    return data;
  },

  async getTrending() {
    const { data, error } = await supabase
      .from('investigations')
      .select(`
        *,
        owner:profiles!owner_id(id, username, display_name, avatar_url)
      `)
      .eq('visibility', 'public')
      .order('stars_count', { ascending: false })
      .limit(6);
    if (error) throw error;
    return data;
  },
};
