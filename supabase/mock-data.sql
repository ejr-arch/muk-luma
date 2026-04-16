-- Mock Data for MUK Events
-- Run this in Supabase SQL Editor after schema.sql

-- Sample Organizations
INSERT INTO public.organizations (id, name, description, logo_url) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Computer Science Department', 'The official Computer Science Department at Makerere University', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200'),
  ('a0000000-0000-0000-0000-000000000002', 'Drama Club', 'Expressing creativity through theatre and performing arts', 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=200'),
  ('a0000000-0000-0000-0000-000000000003', 'Career Services', 'Connecting students with internship and job opportunities', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=200'),
  ('a0000000-0000-0000-0000-000000000004', 'Cultural Clubs', 'Celebrating Uganda''s diverse cultures', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200'),
  ('a0000000-0000-0000-0000-000000000005', 'Sports Office', 'Organizing inter-faculty sports and athletics', 'https://images.unsplash.com/photo-1461896836934-3d2753bdb2db?w=200'),
  ('a0000000-0000-0000-0000-000000000006', 'Rotaract Club', 'Community service and professional development', 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=200'),
  ('a0000000-0000-0000-0000-000000000007', 'Debate Society', 'Fostering critical thinking and public speaking', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=200'),
  ('a0000000-0000-0000-0000-000000000008', 'Music Club', 'For music enthusiasts and aspiring artists', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200')
ON CONFLICT (id) DO NOTHING;

-- Sample Events (using NULL for created_by for demo purposes)
INSERT INTO public.events (id, title, description, date, time, location_name, category, created_by, capacity, image_url) VALUES
  (
    'e0000000-0000-0000-0000-000000000001',
    'Tech for Tomorrow: AI in Africa',
    'Join us for an exciting exploration of how artificial intelligence is shaping the future of Africa. This event brings together industry experts, researchers, and students to discuss AI applications, challenges, and opportunities on the continent.

Topics covered:
- Machine learning in healthcare
- AI for agriculture
- Ethical considerations in AI development
- Career paths in AI

Refreshments will be provided.',
    '2026-05-15',
    '14:00',
    'Central Teaching Facility (CTF)',
    'technology',
    NULL,
    200,
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800'
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'MUK Drama Festival 2026',
    'The annual drama festival returns with a spectacular showcase of student talent. This year''s theme is "Stories That Matter" - original plays that explore contemporary African experiences.

Featuring:
- 8 student productions
- Guest performance by MUK Theatre Group
- Award ceremony
- Meet and greet with cast members',
    '2026-05-20',
    '18:00',
    'Mitchell Hall',
    'cultural',
    NULL,
    500,
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800'
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    'Career Fair: Connect & Grow',
    'The biggest career fair at Makerere University! Connect with over 50 top employers from various industries including:

- Banking & Finance
- Technology
- Healthcare
- Manufacturing
- NGO sector

Bring your CV and dress professionally. Free entry for all students.',
    '2026-06-01',
    '09:00',
    'Africa Hall',
    'career',
    NULL,
    1000,
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
  ),
  (
    'e0000000-0000-0000-0000-000000000004',
    'Inter-Faculty Sports Gala',
    'The biggest sporting event of the year! Cheer for your faculty as students compete across multiple sports:

- Football (Soccer)
- Volleyball
- Basketball
- Athletics
- Table tennis

Come support your faculty and enjoy a day of sports and entertainment. Food and drinks available on site.',
    '2026-06-10',
    '08:00',
    'University Sports Grounds',
    'sports',
    NULL,
    NULL,
    'https://images.unsplash.com/photo-1461896836934-3d2753bdb2db?w=800'
  ),
  (
    'e0000000-0000-0000-0000-000000000005',
    'Cultural Night: Unity in Diversity',
    'Experience the rich cultural diversity of Makerere University! This annual celebration brings together students from all backgrounds to share their traditions through:

- Traditional dances and performances
- Cultural fashion show
- Authentic food court
- Art exhibitions
- Live music

A celebration of unity, diversity, and the Makerere spirit.',
    '2026-06-15',
    '19:00',
    'Ellen Johnson Amphitheatre',
    'social',
    NULL,
    300,
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800'
  ),
  (
    'e0000000-0000-0000-0000-000000000006',
    'Research Symposium: Innovation for Development',
    'Showcase your research and learn from peers! The annual research symposium invites students to present their research projects and innovations.

Categories:
- Science & Technology
- Social Sciences
- Business & Economics
- Health Sciences

Prizes for best presentations in each category.',
    '2026-06-20',
    '09:00',
    'Faculty of Science',
    'academic',
    NULL,
    150,
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800'
  ),
  (
    'e0000000-0000-0000-0000-000000000007',
    'Health & Wellness Week',
    'Taking care of your body and mind! A week dedicated to health awareness and wellness activities:

- Free health screenings
- Mental health workshops
- Fitness classes
- Nutrition seminars
- Yoga and meditation sessions

Open to all students, staff, and the public.',
    '2026-07-01',
    '08:00',
    'Senate Building',
    'health',
    NULL,
    NULL,
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=800'
  ),
  (
    'e0000000-0000-0000-0000-000000000008',
    'Art Exhibition: Expressions of Tomorrow',
    'Discover the creative works of Makerere''s finest art students. This exhibition features:

- Paintings and illustrations
- Sculpture
- Photography
- Digital art
- Mixed media installations

Meet the artists at the opening reception.',
    '2026-07-10',
    '10:00',
    'MUK Art Gallery',
    'art',
    NULL,
    100,
    'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=800'
  ),
  (
    'e0000000-0000-0000-0000-000000000009',
    'Hackathon: Build for Good',
    '48-hour coding challenge to build solutions for social impact. Form teams and compete for prizes while making a difference!

Categories:
- Education technology
- Healthcare access
- Environmental sustainability
- Financial inclusion

Workshops, mentorship, and free food throughout the event.',
    '2026-05-25',
    '18:00',
    'Computer Lab 1',
    'technology',
    NULL,
    100,
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800'
  ),
  (
    'e0000000-0000-0000-0000-000000000010',
    'Open Mic Night',
    'Show off your talents! Whether you sing, rap, poetry, comedy, or have a hidden skill - this night is for you.

Sign up on arrival. Hosted by the MUK Music Club.',
    '2026-05-28',
    '19:00',
    'The Pavilion',
    'social',
    NULL,
    200,
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'
  )
ON CONFLICT (id) DO NOTHING;

-- Link events to organizations
INSERT INTO public.event_organizations (event_id, organization_id) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003'),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005'),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000004'),
  ('e0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001'),
  ('e0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000008')
ON CONFLICT DO NOTHING;
