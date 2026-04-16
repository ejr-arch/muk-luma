-- Sample Data for MUK Events
-- Run this after the schema.sql to populate test data
-- IMPORTANT: Replace 'YOUR_USER_ID' with an actual user ID from auth.users

-- First, get your user ID from auth.users table and use it here
-- Then uncomment and run:

/*
-- Sample Organizations
INSERT INTO public.organizations (name, description) VALUES
  ('Computer Science Department', 'The official Computer Science Department at Makerere University'),
  ('Drama Club', 'Expressing creativity through theatre and performing arts'),
  ('Career Services', 'Connecting students with internship and job opportunities'),
  ('Cultural Clubs', 'Celebrating Uganda diverse cultures'),
  ('Sports Office', 'Organizing inter-faculty sports and athletics'),
  ('Rotaract Club', 'Community service and professional development'),
  ('Music Club', 'For music enthusiasts and aspiring artists'),
  ('Debate Society', 'Fostering critical thinking and public speaking');

-- Sample Events (replace 'REPLACE_WITH_USER_ID' with actual user UUID)
INSERT INTO public.events (title, description, date, time, location_name, category, created_by, capacity, image_url) VALUES
  (
    'Tech for Tomorrow: AI in Africa',
    'Join us for an exciting exploration of how artificial intelligence is shaping the future of Africa. This event brings together industry experts, researchers, and students to discuss AI applications, challenges, and opportunities on the continent.\n\nTopics covered:\n- Machine learning in healthcare\n- AI for agriculture\n- Ethical considerations in AI development\n- Career paths in AI\n\nRefreshments will be provided.',
    '2026-05-15',
    '14:00',
    'Central Teaching Facility (CTF)',
    'technology',
    'REPLACE_WITH_USER_ID',
    200,
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800'
  ),
  (
    'MUK Drama Festival 2026',
    'The annual drama festival returns with a spectacular showcase of student talent. This year theme is "Stories That Matter" - original plays that explore contemporary African experiences.\n\nFeaturing:\n- 8 student productions\n- Guest performance by MUK Theatre Group\n- Award ceremony\n- Meet and greet with cast members',
    '2026-05-20',
    '18:00',
    'Mitchell Hall',
    'cultural',
    'REPLACE_WITH_USER_ID',
    500,
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800'
  ),
  (
    'Career Fair: Connect & Grow',
    'The biggest career fair at Makerere University! Connect with over 50 top employers from various industries including:\n\n- Banking & Finance\n- Technology\n- Healthcare\n- Manufacturing\n- NGO sector\n\nBring your CV and dress professionally. Free entry for all students.',
    '2026-06-01',
    '09:00',
    'Africa Hall',
    'career',
    'REPLACE_WITH_USER_ID',
    1000,
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
  ),
  (
    'Inter-Faculty Sports Gala',
    'The biggest sporting event of the year! Cheer for your faculty as students compete across multiple sports:\n\n- Football (Soccer)\n- Volleyball\n- Basketball\n- Athletics\n- Table tennis\n\nCome support your faculty and enjoy a day of sports and entertainment. Food and drinks available on site.',
    '2026-06-10',
    '08:00',
    'University Sports Grounds',
    'sports',
    'REPLACE_WITH_USER_ID',
    NULL,
    'https://images.unsplash.com/photo-1461896836934- voices-from-the-field?w=800'
  ),
  (
    'Cultural Night: Unity in Diversity',
    'Experience the rich cultural diversity of Makerere University! This annual celebration brings together students from all backgrounds to share their traditions through:\n\n- Traditional dances and performances\n- Cultural fashion show\n- Authentic food court\n- Art exhibitions\n- Live music\n\nA celebration of unity, diversity, and the Makerere spirit.',
    '2026-06-15',
    '19:00',
    'Ellen Johnson Amphitheatre',
    'social',
    'REPLACE_WITH_USER_ID',
    300,
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'
  ),
  (
    'Research Symposium: Innovation for Development',
    'Showcase your research and learn from peers! The annual research symposium invites students to present their research projects and innovations.\n\nCategories:\n- Science & Technology\n- Social Sciences\n- Business & Economics\n- Health Sciences\n\nPrizes for best presentations in each category.',
    '2026-06-20',
    '09:00',
    'Faculty of Science',
    'academic',
    'REPLACE_WITH_USER_ID',
    150,
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800'
  ),
  (
    'Health & Wellness Week',
    'Taking care of your body and mind! A week dedicated to health awareness and wellness activities:\n\n- Free health screenings\n- Mental health workshops\n- Fitness classes\n- Nutrition seminars\n- Yoga and meditation sessions\n\nOpen to all students, staff, and the public.',
    '2026-07-01',
    '08:00',
    'Senate Building',
    'health',
    'REPLACE_WITH_USER_ID',
    NULL,
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800'
  ),
  (
    'Art Exhibition: Expressions of Tomorrow',
    'Discover the creative works of Makerere finest art students. This exhibition features:\n\n- Paintings and illustrations\n- Sculpture\n- Photography\n- Digital art\n- Mixed media installations\n\nMeet the artists at the opening reception.',
    '2026-07-10',
    '10:00',
    'MUK Art Gallery',
    'art',
    'REPLACE_WITH_USER_ID',
    100,
    'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800'
  );

-- Link some events to organizations
INSERT INTO public.event_organizations (event_id, organization_id)
SELECT e.id, o.id
FROM public.events e, public.organizations o
WHERE e.title = 'Tech for Tomorrow: AI in Africa' AND o.name = 'Computer Science Department';

INSERT INTO public.event_organizations (event_id, organization_id)
SELECT e.id, o.id
FROM public.events e, public.organizations o
WHERE e.title = 'MUK Drama Festival 2026' AND o.name = 'Drama Club';

INSERT INTO public.event_organizations (event_id, organization_id)
SELECT e.id, o.id
FROM public.events e, public.organizations o
WHERE e.title = 'Career Fair: Connect & Grow' AND o.name = 'Career Services';

INSERT INTO public.event_organizations (event_id, organization_id)
SELECT e.id, o.id
FROM public.events e, public.organizations o
WHERE e.title = 'Cultural Night: Unity in Diversity' AND o.name = 'Cultural Clubs';
*/
