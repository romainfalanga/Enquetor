import { supabase } from '../supabase';

export const entitiesApi = {
  async list(investigationId: string) {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('investigation_id', investigationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(investigationId: string, entity: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('entities')
      .insert({ ...entity, investigation_id: investigationId, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('entities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('entities').delete().eq('id', id);
    if (error) throw error;
  },
};
