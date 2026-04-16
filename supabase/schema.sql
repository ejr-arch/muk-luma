-- MUK Events Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'organizer', 'student')),
  faculty TEXT,
  hall TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location_name TEXT NOT NULL,
  location_coordinates JSONB,
  category TEXT NOT NULL CHECK (category IN ('academic', 'cultural', 'sports', 'career', 'social', 'technology', 'health', 'art')),
  image_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  capacity INTEGER,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RSVPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'interested')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- EVENT_ORGANIZATIONS TABLE (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_organizations (
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, organization_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_rsvps_user_id ON public.rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON public.rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_status ON public.rsvps(status);
CREATE INDEX IF NOT EXISTS idx_comments_event_id ON public.comments(event_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_organizations ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- EVENTS POLICIES
CREATE POLICY "Published events are viewable by everyone"
  ON public.events FOR SELECT
  USING (is_published = true OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users can update their own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events"
  ON public.events FOR DELETE
  USING (auth.uid() = created_by);

-- RSVPS POLICIES
CREATE POLICY "RSVPs are viewable by everyone"
  ON public.rsvps FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create RSVPs"
  ON public.rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVPs"
  ON public.rsvps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RSVPs"
  ON public.rsvps FOR DELETE
  USING (auth.uid() = user_id);

-- COMMENTS POLICIES
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- ORGANIZATIONS POLICIES
CREATE POLICY "Organizations are viewable by everyone"
  ON public.organizations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own organizations"
  ON public.organizations FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own organizations"
  ON public.organizations FOR DELETE
  USING (auth.uid() = created_by);

-- EVENT_ORGANIZATIONS POLICIES
CREATE POLICY "Event organizations are viewable by everyone"
  ON public.event_organizations FOR SELECT
  USING (true);

CREATE POLICY "Organizers can link events to organizations"
  ON public.event_organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Organizers can unlink events from organizations"
  ON public.event_organizations FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
CREATE POLICY "Anyone can view event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own event images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================
-- Enable realtime for RSVPs and Comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.rsvps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Note: Sample data should be inserted after creating a user through the auth system
-- Below is sample data that can be manually inserted for testing

/*
-- Sample organizations
INSERT INTO public.organizations (id, name, description, created_by) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Computer Science Department', 'The official CS department at Makerere', NULL),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Drama Club', 'Expressing creativity through theatre', NULL),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Career Services', 'Connecting students with opportunities', NULL);

-- Sample events (replace created_by with actual user UUID)
INSERT INTO public.events (id, title, description, date, time, location_name, category, created_by, capacity) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Tech for Tomorrow: AI in Africa', 'Explore how artificial intelligence is shaping the future of Africa. Guest speakers from leading tech companies.', '2026-05-15', '14:00', 'Central Teaching Facility (CTF)', 'technology', NULL, 200),
  ('22222222-2222-2222-2222-222222222222', 'MUK Drama Festival 2026', 'Annual drama festival showcasing student talent in theatre arts.', '2026-05-20', '18:00', 'Mitchell Hall', 'cultural', NULL, 500),
  ('33333333-3333-3333-3333-333333333333', 'Career Fair: Connect & Grow', 'Meet top employers and learn about internship and job opportunities.', '2026-06-01', '09:00', 'Africa Hall', 'career', NULL, 1000),
  ('44444444-4444-4444-4444-444444444444', 'Inter-Faculty Sports Gala', 'Annual sports competition between faculties. Football, volleyball, athletics, and more!', '2026-06-10', '08:00', 'Library Lawn', 'sports', NULL, NULL),
  ('55555555-5555-5555-5555-555555555555', 'Cultural Night: Unity in Diversity', 'Celebrating the diverse cultures at Makerere University through music, dance, and food.', '2026-06-15', '19:00', 'Ellen Johnson Amphitheatre', 'social', NULL, 300);
*/
