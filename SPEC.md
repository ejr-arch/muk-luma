# MUK Events - Makerere University Event Platform

## Concept & Vision

MUK Events is a vibrant, community-driven platform that connects Makerere University students through campus events. The design language draws inspiration from Uganda's colorful culture - bold, warm, and energetic - while maintaining the professionalism expected of Uganda's premier institution. The platform feels alive with activity, celebrating the dynamic student life at Makerere.

The aesthetic balances modern minimalism with moments of bold color, creating a space that's both functional for low-bandwidth environments and visually distinctive. Think "campus bulletin board meets modern web app."

---

## Design Language

### Aesthetic Direction
Inspired by Makerere's red brick architecture and Uganda's lush green campus, combined with modern SaaS aesthetics. Clean interfaces with vibrant accent colors that pop against neutral backgrounds.

### Color Palette
```
--primary:        #C8102E    /* Makerere Red */
--primary-dark:   #9B0D24    /* Darker red for hover states */
--secondary:      #2D5016    /* Campus Green */
--accent:         #F4B41A    /* Golden Yellow - call to action */
--background:     #FAFAFA    /* Off-white */
--surface:       #FFFFFF    /* Cards, modals */
--text-primary:   #1A1A2E    /* Near black */
--text-secondary: #6B7280   /* Muted gray */
--border:         #E5E7EB    /* Light borders */
--success:        #10B981    /* Going status */
--info:           #3B82F6    /* Interested status */
--error:          #EF4444    /* Error states */
```

### Typography
- **Headings**: Inter (700, 600) - clean, modern, highly legible
- **Body**: Inter (400, 500) - excellent readability
- **Accent/Labels**: Inter (500, 600) - small caps for categories
- **Fallbacks**: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px
- Container max-width: 1280px
- Card padding: 24px
- Section spacing: 64px
- Mobile padding: 16px

### Motion Philosophy
- **Micro-interactions**: 150ms ease-out for hovers, button presses
- **Page transitions**: 300ms ease-in-out for modals, drawers
- **Loading states**: Subtle pulse animations (2s infinite)
- **Stagger animations**: 50ms delay between list items on load
- **Realtime updates**: Smooth counter animations when RSVPs change

### Visual Assets
- **Icons**: Lucide Icons (consistent stroke width, MIT licensed)
- **Images**: WebP format with JPEG fallback, lazy-loaded
- **Decorative**: Subtle gradient overlays on hero sections
- **Empty states**: Custom SVG illustrations

---

## Layout & Structure

### Page Architecture

#### 1. Navigation (Sticky)
- Logo + "MUK Events" branding (left)
- Main nav: Events, Organizations (center)
- User actions: Search, Notifications bell, Profile dropdown (right)
- Mobile: Hamburger menu with slide-in drawer

#### 2. Homepage
- **Hero Section**: Featured/upcoming event with full-width image, countdown
- **Quick Stats**: Total events, active RSVPs, community members
- **Event Feed**: Filterable grid of event cards
- **Categories**: Horizontal scrolling category pills

#### 3. Event Creation (Modal/Page)
- Multi-step form with progress indicator
- Image upload with drag-and-drop
- Location picker (preset locations + custom)
- Organization tagging

#### 4. Event Detail Page
- Large hero image
- Event metadata (date, time, location, category)
- Organizer info with organization badge
- RSVP section with live count
- Tabbed content: About | Comments | Attendees
- Related events sidebar

#### 5. Profile Page
- User avatar and bio
- Stats: Events created, RSVPs, comments
- Tabs: My Events | Attending | Past Events

#### 6. Auth Pages
- Clean centered card
- Email/password form
- Google OAuth button
- Role selection on signup

### Responsive Strategy
- **Desktop (1024px+)**: 3-column event grid, sidebar layouts
- **Tablet (768px-1023px)**: 2-column grid, stacked sidebars
- **Mobile (<768px)**: Single column, bottom navigation, full-screen modals

---

## Features & Interactions

### Authentication
| Action | Behavior |
|--------|----------|
| Sign Up | Email + password fields, role selection (student/organizer), loading state on submit |
| Sign In | Email + password, "Remember me" checkbox, forgot password link |
| Google OAuth | Redirect to Google, callback to dashboard |
| Sign Out | Confirmation toast, redirect to homepage |
| Protected Routes | Redirect to /auth if not logged in |

### Event Discovery
| Action | Behavior |
|--------|----------|
| View Events | Paginated grid (12 per page), skeleton loading |
| Filter by Category | Click category pill, URL updates, instant filter |
| Sort | Dropdown: Upcoming (default), Trending, Newest |
| Search | Debounced input (300ms), searches title + description |
| Empty State | Illustration + "No events found" + CTA to create |

### Event Creation
| Action | Behavior |
|--------|----------|
| Open Form | Slide-up modal or full page |
| Upload Image | Drag-drop zone, preview, 2MB limit, progress indicator |
| Select Location | Dropdown with preset venues + "Add custom" option |
| Select Category | Multi-select chips |
| Submit | Validate all fields, loading state, success redirect |
| Error | Inline field errors, toast for server errors |

### RSVP System
| Action | Behavior |
|--------|----------|
| Click "Going" | Toggle state, animate counter, realtime update to others |
| Click "Interested" | Toggle state, different color indicator |
| Already RSVP'd | Show current state, allow change |
| Remove RSVP | Confirm dialog, animate counter down |
| At Capacity | "Going" disabled, show waitlist option |

### Comments
| Action | Behavior |
|--------|----------|
| Post Comment | Textarea, submit button, optimistic update |
| Realtime | New comments appear without refresh |
| Delete Own | Swipe or trash icon, confirm |
| Empty | "Be the first to comment" prompt |

### Profile
| Action | Behavior |
|--------|----------|
| View Profile | Display all user info and stats |
| Edit Profile | Inline editing for name, faculty, hall |
| View My Events | Filterable list of created events |
| View Attending | List of RSVP'd events |

---

## Component Inventory

### Navigation Bar
- **Default**: White background, subtle shadow on scroll
- **Mobile**: Hamburger icon, drawer overlay
- **User Menu**: Avatar, dropdown with profile/settings/logout

### Event Card
- **Default**: Image top, content below, category badge
- **Hover**: Slight lift (transform: translateY(-4px)), shadow increase
- **Loading**: Skeleton with pulse animation
- **States**: Upcoming (normal), Past (grayscale), Full (overlay badge)

### Button
- **Primary**: Red background, white text, hover darkens
- **Secondary**: White background, red border/text
- **Ghost**: Transparent, text only
- **States**: Default, Hover, Active (pressed), Disabled (50% opacity), Loading (spinner)

### Form Inputs
- **Default**: Border, rounded corners, placeholder text
- **Focus**: Red border, subtle glow
- **Error**: Red border, error message below
- **Success**: Green checkmark icon

### Modal
- **Backdrop**: Semi-transparent black, click to close
- **Content**: Centered white card, max-width 500px
- **Animation**: Fade + scale in

### Toast Notifications
- **Success**: Green left border, checkmark icon
- **Error**: Red left border, X icon
- **Info**: Blue left border, info icon
- **Position**: Bottom right, stacked

### Avatar
- **Sizes**: sm (32px), md (40px), lg (64px), xl (96px)
- **Fallback**: Initials on colored background
- **With Status**: Green dot for online

### Badge/Pill
- **Category**: Colored background matching category
- **RSVP Status**: "Going" green, "Interested" blue
- **Role**: Admin (red), Organizer (yellow), Student (gray)

---

## Technical Approach

### Architecture
```
/
├── index.html              # Homepage
├── auth.html               # Login/Signup
├── event.html              # Event detail
├── create-event.html       # Create event
├── profile.html            # User profile
├── css/
│   ├── variables.css       # CSS custom properties
│   ├── base.css            # Reset, typography
│   ├── components.css      # Reusable components
│   ├── layout.css          # Grid, spacing
│   └── pages.css           # Page-specific styles
├── js/
│   ├── config.js           # Supabase config
│   ├── auth.js             # Auth functions
│   ├── events.js           # Event CRUD
│   ├── rsvp.js             # RSVP logic
│   ├── comments.js         # Comment system
│   ├── realtime.js         # Realtime subscriptions
│   ├── utils.js            # Helpers
│   └── app.js              # Main app initialization
├── supabase/
│   └── schema.sql          # Database schema
└── assets/
    └── images/             # Static assets
```

### Supabase Integration
- Client-side only (no backend server)
- Anonymous access for reading events
- Authenticated access for RSVPs, comments, creating events
- Row Level Security for data protection

### Data Flow
1. Page loads → Initialize Supabase client
2. Check auth state → Set up UI accordingly
3. Fetch data based on page → Render with skeleton → Replace with content
4. User actions → Update UI optimistically → Sync to Supabase
5. Realtime subscription → Update counters/comments live

### API Patterns
```javascript
// Fetch events with filters
supabase
  .from('events')
  .select('*, users(name), rsvps(count)')
  .eq('date', '>=', new Date().toISOString())
  .order('date', { ascending: true })

// Create RSVP with conflict check
supabase
  .from('rsvps')
  .upsert({ user_id, event_id, status }, { 
    onConflict: 'user_id,event_id' 
  })

// Realtime subscription
supabase
  .channel('event-123')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'rsvps',
    filter: 'event_id=eq.123'
  }, handleRSVPUpdate)
  .subscribe()
```

### Performance Optimizations
- Lazy load images with `loading="lazy"`
- Virtual scrolling for long event lists
- Debounce search inputs (300ms)
- Batch multiple small queries
- Use Supabase's built-in caching
- WebP images with fallback
- Minified CSS/JS in production
- Service worker for offline capability (future)

### Security (RLS Policies)
```sql
-- Events: Anyone can read, only creator can update/delete
CREATE POLICY "Public events are viewable by everyone"
  ON events FOR SELECT USING (true);

CREATE POLICY "Users can insert their own events"
  ON events FOR INSERT WITH CHECK (auth.uid() = created_by);

-- RSVPs: Only authenticated users, own RSVP only
CREATE POLICY "Authenticated users can view RSVPs"
  ON rsvps FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own RSVPs"
  ON rsvps FOR ALL USING (auth.uid() = user_id);
```

---

## Database Schema

### Tables
1. **profiles** (extends auth.users)
2. **events**
3. **rsvps**
4. **comments**
5. **organizations**
6. **event_organizations**

### Relationships
- events.created_by → profiles.id
- rsvps.user_id → profiles.id
- rsvps.event_id → events.id
- comments.user_id → profiles.id
- comments.event_id → events.id
- event_organizations: many-to-many between events and organizations

---

## Content Strategy

### Sample Events
1. "Tech for Tomorrow: AI in Africa's Future" - Computer Science Dept
2. "MUK Drama Festival 2024" - Drama Club
3. "Career Fair: Connecting Students to Opportunities" - Career Services
4. "Cultural Night: Unity in Diversity" - Cultural Clubs
5. "Sports Gala: Inter-Faculty Championships" - Sports Office

### Categories
- Academic
- Cultural
- Sports
- Career
- Social
- Technology
- Health
- Art

### Preset Locations
- Central Teaching Facility (CTF)
- Faculty of Science
- Mitchell Hall
- Africa Hall
- University Hall
- Nkrumah Hall
- Senate Building
-library Lawn

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| No events | Show illustration + "No upcoming events" + CTA |
| Network offline | Show cached data if available + offline banner |
| Image upload fails | Retry button, error message, fallback placeholder |
| RSVP fails | Toast error, revert optimistic update |
| Event full | Disable "Going", offer "Interested" instead |
| Comment too long | Character counter, prevent submission |
| Invalid form input | Inline validation, field highlighting |
| Session expired | Redirect to login with return URL |
