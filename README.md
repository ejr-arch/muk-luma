# MUK Events - Makerere University Event Platform

A modern, responsive web platform for discovering, creating, and attending events at Makerere University.

## Features

- **Event Discovery**: Browse upcoming events by category, date, or popularity
- **Event Creation**: Create and publish events with images, details, and capacity limits
- **RSVP System**: Mark yourself as "Going" or "Interested" with real-time updates
- **Comments**: Engage with event discussions
- **User Profiles**: Track your created events and RSVPs
- **Real-time Updates**: Live RSVP counts and comments via Firebase Realtime
- **Role-based Access**: Student, Organizer, and Admin roles
- **Mobile-first Design**: Optimized for low-bandwidth environments

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript with Vite
- **Backend**: Firebase (Auth, Realtime Database)
- **Storage**: Cloudinary
- **Build Tool**: Vite

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Firebase and Cloudinary credentials.

### 3. Start development server

```bash
npm run dev
```

Visit `http://localhost:5173`

### 4. Build for production

```bash
npm run build
```

Output will be in `dist/` folder.

## Environment Variables

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_API_KEY=
VITE_CLOUDINARY_API_SECRET=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

## Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password, Google)
3. Enable **Realtime Database**
4. Set database rules to allow read/write for testing
5. Copy credentials to `.env`

## Cloudinary Setup

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Go to Settings → Upload → Upload presets
3. Add upload preset with:
   - Name: `muk_events`
   - Signing mode: Unsigned
   - Folder: `muk_luma`
4. Copy credentials to `.env`

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@muk-events.com | demo123456 |
| Organizer | organizer@muk-events.com | demo123456 |
| Admin | admin@muk-events.com | demo123456 |

**Note:** Create these users manually in Firebase Console → Authentication

## Import Mock Data

1. Open `import-data.html` in browser
2. Click "Import Mock Data"
3. All events, organizations, RSVPs, and comments will be imported

## Deployment

### Firebase Hosting (Recommended)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select project, set public directory to dist
firebase deploy
```

### Vercel

```bash
npm i -g vercel
vercel
```

### Netlify

1. Run `npm run build`
2. Drag `dist/` folder to [netlify.com](https://netlify.com)

## Project Structure

```
muk-luma/
├── index.html              # Homepage
├── auth.html              # Authentication
├── events.html            # Events listing
├── event.html             # Event detail page
├── create-event.html      # Create event form
├── profile.html           # User profile
├── organizations.html     # Organizations listing
├── import-data.html       # Data import tool
├── css/
│   ├── variables.css     # CSS custom properties
│   ├── base.css          # Reset & typography
│   ├── components.css    # Reusable components
│   ├── layout.css        # Layout & navigation
│   └── pages.css         # Page-specific styles
├── js/
│   ├── config.js         # Firebase configuration
│   ├── auth.js           # Authentication
│   ├── events.js         # Event CRUD operations
│   ├── rsvp.js           # RSVP functionality
│   ├── comments.js       # Comments system
│   ├── realtime.js       # Real-time subscriptions
│   ├── storage.js        # File uploads (Cloudinary)
│   ├── organizations.js   # Organization functions
│   ├── utils.js          # Helper functions
│   └── app.js            # Main app initialization
├── firebase/
│   └── mock-data.json    # Sample data backup
├── .env.example          # Environment template
├── vite.config.js        # Vite configuration
└── package.json
```

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers

## License

MIT License

---

Built with care at Makerere University
