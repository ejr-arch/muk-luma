# MUK Events - Makerere University Event Platform

A modern, responsive web platform for discovering, creating, and attending events at Makerere University.

## Features

- **Event Discovery**: Browse upcoming events by category, date, or popularity
- **Event Creation**: Create and publish events with images, details, and capacity limits
- **RSVP System**: Mark yourself as "Going" or "Interested" with real-time updates
- **Comments**: Engage with event discussions
- **User Profiles**: Track your created events and RSVPs
- **Real-time Updates**: Live RSVP counts and comments via Supabase Realtime
- **Role-based Access**: Student, Organizer, and Admin roles
- **Mobile-first Design**: Optimized for low-bandwidth environments

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (structured for React migration)
- **Backend**: Supabase (Auth, Database, Storage, Realtime)
- **Styling**: Custom CSS with design system variables

## Project Structure

```
muk-luma/
├── index.html              # Homepage
├── auth.html               # Authentication
├── events.html             # Events listing
├── event.html              # Event detail page
├── create-event.html       # Create event form
├── profile.html            # User profile
├── css/
│   ├── variables.css       # CSS custom properties
│   ├── base.css            # Reset & typography
│   ├── components.css      # Reusable components
│   ├── layout.css          # Layout & navigation
│   └── pages.css           # Page-specific styles
├── js/
│   ├── config.js           # Supabase configuration
│   ├── auth.js             # Authentication
│   ├── events.js           # Event CRUD operations
│   ├── rsvp.js             # RSVP functionality
│   ├── comments.js         # Comments system
│   ├── realtime.js         # Real-time subscriptions
│   ├── storage.js          # File uploads
│   ├── utils.js             # Helper functions
│   └── app.js              # Main app initialization
├── supabase/
│   └── schema.sql          # Database schema
└── SPEC.md                  # Design specification
```

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Copy your project URL and anon/public key from Settings > API

### 2. Configure Environment Variables

Create a `.env` file (optional, for production):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Update the `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in `js/config.js`:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'your-anon-key';
```

### 3. Run the Database Schema

1. In Supabase Dashboard, go to SQL Editor
2. Copy and paste the contents of `supabase/schema.sql`
3. Click "Run" to execute

This will create:
- All required tables (profiles, events, rsvps, comments, organizations)
- Indexes for performance
- Row Level Security policies
- Storage buckets for images
- Realtime publications

### 4. Enable Google OAuth (Optional)

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials (Client ID and Secret)
4. Add authorized redirect URI in Google Cloud Console

### 5. Start the Development Server

Since this is a static frontend, you can use any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using VS Code Live Server extension
# Right-click index.html > "Open with Live Server"
```

Then visit `http://localhost:8000`

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends auth.users) |
| `events` | Event details and metadata |
| `rsvps` | User RSVPs for events |
| `comments` | Comments on events |
| `organizations` | Clubs, guilds, departments |
| `event_organizations` | Many-to-many event-organization links |

### Key Relationships

- `events.created_by` → `profiles.id`
- `rsvps.user_id` → `profiles.id`
- `rsvps.event_id` → `events.id`
- `comments.user_id` → `profiles.id`
- `comments.event_id` → `events.id`

## API Usage Examples

### Fetch Events
```javascript
const { data, error } = await supabase
  .from('events')
  .select('*, profiles(name), rsvps(count)')
  .gte('date', new Date().toISOString().split('T')[0])
  .order('date', { ascending: true });
```

### Create RSVP
```javascript
const { data, error } = await supabase
  .from('rsvps')
  .upsert({
    user_id: userId,
    event_id: eventId,
    status: 'going'
  }, { onConflict: 'user_id,event_id' });
```

### Subscribe to Real-time Updates
```javascript
supabase
  .channel('event-123')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'rsvps',
    filter: 'event_id=eq.123'
  }, handleRSVPUpdate)
  .subscribe();
```

## Sample Data

To add sample data for testing, insert these after creating a user:

```sql
-- Get your user ID from auth.users first
-- Then insert sample events:

INSERT INTO events (title, description, date, time, location_name, category, created_by, capacity)
VALUES (
  'Tech for Tomorrow: AI in Africa',
  'Explore how artificial intelligence is shaping the future of Africa.',
  '2026-05-15',
  '14:00',
  'Central Teaching Facility (CTF)',
  'technology',
  'your-user-uuid',
  200
);
```

## Performance Optimizations

- Lazy loading images with `loading="lazy"`
- Debounced search inputs (300ms)
- Efficient Supabase queries with proper indexing
- Minimal API calls through careful data fetching
- WebP images with fallback support
- Mobile-first responsive design

## Security

- Row Level Security (RLS) on all tables
- Users can only edit their own data
- Authenticated actions required for RSVPs and comments
- File upload restrictions (2MB limit, image types only)

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome for Android)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

---

Built with care at Makerere University
