# CookFeed 🍳

Your personal recipe book & feed. Save, organize, and share your favorite recipes.

## Features

- 📝 **Save Recipes** - Add your favorite recipes with photos, ingredients, and steps
- 🔍 **Find Easily** - Search by title, ingredient, or tag
- 👥 **Share & Follow** - Connect with other home cooks
- ❤️ **Favorites** - Save recipes you love
- 🔒 **Privacy** - Keep recipes private or share to the feed
- 📱 **Mobile First** - Optimized for mobile devices

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: [Turso](https://turso.tech/) (SQLite at the edge)
- **Hosting**: [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd cookfeed
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in the required values in `.env`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Setup

For local development, the app uses a local SQLite file. For production:

1. Create a Turso database at [turso.tech](https://turso.tech)
2. Get your database URL and auth token
3. Add them to your `.env` file

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/             # Authenticated app routes
│   │   ├── feed/          # Home feed
│   │   ├── search/        # Search recipes
│   │   ├── recipe/        # Recipe pages (add, view, edit)
│   │   ├── favorites/     # Saved recipes
│   │   └── profile/       # User profile
│   ├── auth/              # Authentication pages
│   └── page.tsx           # Landing page
├── components/            # Reusable components
├── lib/                   # Utilities and database
│   └── db.ts             # Database configuration
└── types/                 # TypeScript types
    └── index.ts          # Database & API types
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## Deployment

### Step 1: Set up Turso Database

1. Go to [turso.tech](https://turso.tech) and sign up (free tier available)
2. Create a new database called `cookfeed`
3. Click on the database and go to **Settings** or use CLI:
   - Get Database URL (looks like `libsql://cookfeed-username.turso.io`)
   - Create an Auth Token

**Using Turso CLI (alternative):**
```bash
# Install CLI (Windows - use WSL or PowerShell)
irm get.tur.so/install.ps1 | iex

# Login
turso auth login

# Create database
turso db create cookfeed

# Get URL
turso db show cookfeed --url

# Create token
turso db tokens create cookfeed
```

### Step 2: Initialize Database Tables

After getting your Turso credentials, add them to `.env.local`:
```env
TURSO_DATABASE_URL=libsql://cookfeed-username.turso.io
TURSO_AUTH_TOKEN=your-token-here
```

Then run:
```bash
npm run db:init
```

### Step 3: Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add these environment variables in Vercel:
   - `TURSO_DATABASE_URL` - Your Turso database URL
   - `TURSO_AUTH_TOKEN` - Your Turso auth token
   - `NEXTAUTH_SECRET` - A random secret (generate with `openssl rand -base64 32`)
   - `NEXTAUTH_URL` - Your Vercel URL (e.g., `https://cookfeed.vercel.app`)
   - `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret

4. **Important**: Update Google OAuth redirect URIs in Google Cloud Console:
   - Add `https://your-app.vercel.app/api/auth/callback/google`

5. Deploy!

### Step 4: Initialize Production Database

After deploying, initialize the database by visiting:
```
https://your-app.vercel.app/api/db/init
```
(POST request - you can use curl or Postman)

Or use curl:
```bash
curl -X POST https://your-app.vercel.app/api/db/init
```

## License

MIT
