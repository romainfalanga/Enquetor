import { supabase } from '../supabase';

export const hypothesesApi = {
  async list(investigationId: string) {
    const { data, error } = await supabase
      .from('hypotheses')
      .select('*')
      .eq('investigation_id', investigationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(investigationId: string, hypothesis: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('hypotheses')
      .insert({ ...hypothesis, investigation_id: investigationId, created_by: user?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('hypotheses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase.from('hypotheses').delete().eq('id', id);
    if (error) throw error;
  },
};
