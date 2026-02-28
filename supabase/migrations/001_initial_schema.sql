-- =============================================
-- Enquetor – Database Schema
-- Citizen Investigation Social Network
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (extends Supabase Auth)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::TEXT, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- INVESTIGATIONS
-- =============================================
CREATE TABLE investigations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  category TEXT DEFAULT 'other' CHECK (category IN ('environnement', 'politique', 'local', 'corporate', 'historique', 'other')),
  cover_image_url TEXT DEFAULT '',
  is_featured BOOLEAN DEFAULT FALSE,
  fork_of UUID REFERENCES investigations(id) ON DELETE SET NULL,
  stars_count INTEGER DEFAULT 0,
  contributors_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVESTIGATION MEMBERS
-- =============================================
CREATE TABLE investigation_members (
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (investigation_id, user_id)
);

-- =============================================
-- ENTITIES (investigation nodes)
-- =============================================
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  properties JSONB DEFAULT '{}',
  confidence TEXT NOT NULL DEFAULT 'unverified',
  status TEXT NOT NULL DEFAULT 'to_investigate',
  provenance JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ,
  coordinates JSONB,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entities_investigation ON entities(investigation_id);
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_tags ON entities USING GIN(tags);

-- =============================================
-- LINKS (investigation edges)
-- =============================================
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  source_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT DEFAULT '',
  confidence TEXT NOT NULL DEFAULT 'unverified',
  status TEXT NOT NULL DEFAULT 'to_investigate',
  provenance JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_links_investigation ON links(investigation_id);
CREATE INDEX idx_links_source ON links(source_id);
CREATE INDEX idx_links_target ON links(target_id);

-- =============================================
-- HYPOTHESES
-- =============================================
CREATE TABLE hypotheses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'refuted', 'suspended')),
  supporting_entity_ids UUID[] DEFAULT '{}',
  supporting_link_ids UUID[] DEFAULT '{}',
  contradicting_entity_ids UUID[] DEFAULT '{}',
  contradicting_link_ids UUID[] DEFAULT '{}',
  parent_hypothesis_id UUID REFERENCES hypotheses(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hypotheses_investigation ON hypotheses(investigation_id);

-- =============================================
-- LEADS (action items)
-- =============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'dismissed')),
  related_entity_ids UUID[] DEFAULT '{}',
  related_link_ids UUID[] DEFAULT '{}',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_investigation ON leads(investigation_id);

-- =============================================
-- STARS (bookmark / like)
-- =============================================
CREATE TABLE stars (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, investigation_id)
);

-- Update stars_count on star/unstar
CREATE OR REPLACE FUNCTION update_stars_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE investigations SET stars_count = stars_count + 1 WHERE id = NEW.investigation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE investigations SET stars_count = stars_count - 1 WHERE id = OLD.investigation_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_star_change
  AFTER INSERT OR DELETE ON stars
  FOR EACH ROW EXECUTE FUNCTION update_stars_count();

-- =============================================
-- FOLLOWS
-- =============================================
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- =============================================
-- COMMENTS
-- =============================================
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_investigation ON comments(investigation_id);

-- =============================================
-- ACTIVITY LOG
-- =============================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_investigation ON activity_log(investigation_id);
CREATE INDEX idx_activity_user ON activity_log(user_id);

-- =============================================
-- REPORTS (moderation)
-- =============================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('investigation', 'comment', 'user')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('harassment', 'doxxing', 'misinformation', 'spam', 'other')),
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Investigations: public read, members write
CREATE POLICY "Public investigations are readable" ON investigations FOR SELECT
  USING (visibility = 'public' OR visibility = 'unlisted' OR owner_id = auth.uid()
    OR id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can create" ON investigations FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update" ON investigations FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owner can delete" ON investigations FOR DELETE USING (owner_id = auth.uid());

-- Members: readable by investigation participants, writable by owner or self-join on public
CREATE POLICY "Members are readable" ON investigation_members FOR SELECT
  USING (investigation_id IN (SELECT id FROM investigations WHERE visibility = 'public' OR visibility = 'unlisted' OR owner_id = auth.uid())
    OR user_id = auth.uid());
CREATE POLICY "Can join public investigations" ON investigation_members FOR INSERT
  WITH CHECK (user_id = auth.uid() AND (
    investigation_id IN (SELECT id FROM investigations WHERE visibility = 'public')
    OR investigation_id IN (SELECT id FROM investigations WHERE owner_id = auth.uid())
  ));
CREATE POLICY "Owner can manage members" ON investigation_members FOR DELETE
  USING (user_id = auth.uid() OR investigation_id IN (SELECT id FROM investigations WHERE owner_id = auth.uid()));

-- Entities/Links/Hypotheses/Leads: read if investigation visible, write if editor
CREATE POLICY "Read entities" ON entities FOR SELECT
  USING (investigation_id IN (SELECT id FROM investigations WHERE visibility IN ('public', 'unlisted') OR owner_id = auth.uid())
    OR investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid()));
CREATE POLICY "Editors can insert entities" ON entities FOR INSERT
  WITH CHECK (investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Editors can update entities" ON entities FOR UPDATE
  USING (investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Editors can delete entities" ON entities FOR DELETE
  USING (investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Same policies for links
CREATE POLICY "Read links" ON links FOR SELECT
  USING (investigation_id IN (SELECT id FROM investigations WHERE visibility IN ('public', 'unlisted') OR owner_id = auth.uid())
    OR investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid()));
CREATE POLICY "Editors can insert links" ON links FOR INSERT
  WITH CHECK (investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Editors can update links" ON links FOR UPDATE
  USING (investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Editors can delete links" ON links FOR DELETE
  USING (investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Same for hypotheses
CREATE POLICY "Read hypotheses" ON hypotheses FOR SELECT
  USING (investigation_id IN (SELECT id FROM investigations WHERE visibility IN ('public', 'unlisted') OR owner_id = auth.uid())
    OR investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid()));
CREATE POLICY "Editors can insert hypotheses" ON hypotheses FOR INSERT
  WITH CHECK (investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Editors can update hypotheses" ON hypotheses FOR UPDATE
  USING (investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Editors can delete hypotheses" ON hypotheses FOR DELETE
  USING (investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Same for leads
CREATE POLICY "Read leads" ON leads FOR SELECT
  USING (investigation_id IN (SELECT id FROM investigations WHERE visibility IN ('public', 'unlisted') OR owner_id = auth.uid())
    OR investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid()));
CREATE POLICY "Editors can insert leads" ON leads FOR INSERT
  WITH CHECK (investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Editors can update leads" ON leads FOR UPDATE
  USING (investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Editors can delete leads" ON leads FOR DELETE
  USING (investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid() AND role IN ('owner', 'editor')));

-- Stars: own read/write
CREATE POLICY "Read stars" ON stars FOR SELECT USING (TRUE);
CREATE POLICY "Users can star" ON stars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unstar" ON stars FOR DELETE USING (auth.uid() = user_id);

-- Follows: public read, own write
CREATE POLICY "Read follows" ON follows FOR SELECT USING (TRUE);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Comments: public read on public investigations, own write
CREATE POLICY "Read comments" ON comments FOR SELECT
  USING (investigation_id IN (SELECT id FROM investigations WHERE visibility IN ('public', 'unlisted'))
    OR investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own comments editable" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Own comments deletable" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Activity log: readable like investigation
CREATE POLICY "Read activity" ON activity_log FOR SELECT
  USING (investigation_id IN (SELECT id FROM investigations WHERE visibility IN ('public', 'unlisted'))
    OR investigation_id IN (SELECT investigation_id FROM investigation_members WHERE user_id = auth.uid()));
CREATE POLICY "System can log" ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reports: only own
CREATE POLICY "Users can report" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can see own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- Notifications: own only
CREATE POLICY "Own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can notify" ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Mark own as read" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- ENABLE REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE entities;
ALTER PUBLICATION supabase_realtime ADD TABLE links;
ALTER PUBLICATION supabase_realtime ADD TABLE hypotheses;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
