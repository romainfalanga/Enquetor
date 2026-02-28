import { supabase } from '../supabase';

export const socialApi = {
  // --- Stars ---
  async toggleStar(investigationId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('stars')
      .select('id')
      .eq('user_id', user.id)
      .eq('investigation_id', investigationId)
      .maybeSingle();

    if (existing) {
      await supabase.from('stars').delete().eq('id', existing.id);
      return false;
    } else {
      await supabase.from('stars').insert({ user_id: user.id, investigation_id: investigationId });
      return true;
    }
  },

  async isStarred(investigationId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('stars')
      .select('id')
      .eq('user_id', user.id)
      .eq('investigation_id', investigationId)
      .maybeSingle();

    return !!data;
  },

  async getStarCount(investigationId: string) {
    const { count, error } = await supabase
      .from('stars')
      .select('*', { count: 'exact', head: true })
      .eq('investigation_id', investigationId);
    if (error) throw error;
    return count || 0;
  },

  // --- Follows ---
  async toggleFollow(targetUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    if (existing) {
      await supabase.from('follows').delete().eq('id', existing.id);
      return false;
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
      return true;
    }
  },

  async isFollowing(targetUserId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    return !!data;
  },

  async getFollowerCount(userId: string) {
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
    return count || 0;
  },

  async getFollowingCount(userId: string) {
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);
    return count || 0;
  },

  // --- Comments ---
  async getComments(investigationId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!user_id(id, username, display_name, avatar_url)
      `)
      .eq('investigation_id', investigationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async addComment(investigationId: string, content: string, parentId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        investigation_id: investigationId,
        user_id: user.id,
        content,
        parent_id: parentId || null,
      })
      .select(`
        *,
        author:profiles!user_id(id, username, display_name, avatar_url)
      `)
      .single();
    if (error) throw error;
    return data;
  },

  async deleteComment(id: string) {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Members ---
  async joinInvestigation(investigationId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('investigation_members')
      .insert({ investigation_id: investigationId, user_id: user.id, role: 'contributor' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async leaveInvestigation(investigationId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('investigation_members')
      .delete()
      .eq('investigation_id', investigationId)
      .eq('user_id', user.id);
    if (error) throw error;
  },

  async getMembers(investigationId: string) {
    const { data, error } = await supabase
      .from('investigation_members')
      .select(`
        *,
        user:profiles!user_id(id, username, display_name, avatar_url)
      `)
      .eq('investigation_id', investigationId)
      .order('joined_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async isMember(investigationId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('investigation_members')
      .select('id')
      .eq('investigation_id', investigationId)
      .eq('user_id', user.id)
      .maybeSingle();

    return !!data;
  },

  // --- Profiles ---
  async getProfile(username: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(updates: Record<string, unknown>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getUserInvestigations(userId: string) {
    const { data, error } = await supabase
      .from('investigations')
      .select(`
        *,
        owner:profiles!owner_id(id, username, display_name, avatar_url)
      `)
      .eq('owner_id', userId)
      .eq('visibility', 'public')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // --- Reports ---
  async report(data: { investigation_id?: string; comment_id?: string; reported_user_id?: string; reason: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('reports')
      .insert({ ...data, reporter_id: user.id });
    if (error) throw error;
  },
};
