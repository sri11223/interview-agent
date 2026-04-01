# PrepAI — AI-Powered Interview Practice Platform

PrepAI is a full-stack web application that lets you practice technical and behavioral interviews with an AI voice interviewer. Get real-time feedback, track your progress, and sharpen your skills across System Design, DSA, Development, and Behavioral categories.

---

## Features

- **AI Voice Interviews** — Live voice conversations powered by [Vapi AI](https://vapi.ai)
- **AI Question & Feedback Generation** — Dynamic questions and detailed feedback via [OpenRouter](https://openrouter.ai)
- **Code Editor** — In-browser code editor for DSA and development practice sessions
- **Candidate Proctoring** — Photo capture and video recording during interviews
- **Interview History** — Review all past sessions with scores and feedback breakdowns
- **Feedback Email** — Automated feedback delivery via Nodemailer after each session
- **User Avatar Dropdown** — Profile menu with sign-out in the dashboard header
- **Authentication** — Google OAuth via Supabase Auth (dedicated Sign In / Sign Up flows)
- **Responsive UI** — Fully responsive across desktop and mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | JavaScript / TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| UI Components | [Radix UI](https://radix-ui.com) + [shadcn/ui](https://ui.shadcn.com) |
| Database & Auth | [Supabase](https://supabase.com) (PostgreSQL + Google OAuth) |
| AI Voice Agent | [Vapi AI](https://vapi.ai) |
| AI Text / Feedback | [OpenRouter](https://openrouter.ai) (OpenAI-compatible API) |
| Email | [Nodemailer](https://nodemailer.com) |
| Icons | [Lucide React](https://lucide.dev) |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/interview-agent.git
cd interview-agent
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Supabase — Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Vapi AI — https://vapi.ai → Dashboard → API Keys
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_api_key

# OpenRouter — https://openrouter.ai → Keys
OPENROUTER_API_KEY=your_openrouter_api_key

# App URL
NEXT_PUBLIC_HOST_URL=http://localhost:3000

# Google OAuth (configured in Supabase)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Set up the database

Run the SQL scripts in the `database/` folder using the Supabase SQL editor.  
See [`database/SETUP_GUIDE.md`](database/SETUP_GUIDE.md) for step-by-step instructions.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
app/
  page.js                   # Landing page
  auth/page.jsx             # Sign In / Sign Up (Google OAuth)
  (main)/
    layout.js               # Dashboard shell (AuthGuard)
    provider.js             # Sidebar + header with UserMenu
    dashboard/              # Main dashboard
      create-interview/     # Create a new practice session
      all-interview/        # Browse all available practice sets
    scheduled-interview/    # Interview history
    interview-feedback/     # Detailed feedback view
    candidate-report/       # Candidate performance report
    profile/                # User profile page
    billing/                # Progress / billing page
  interview/[interview_id]/
    start/                  # Live interview session (voice + code editor)
    completed/              # Post-interview summary
  api/
    ai-conversation/        # AI voice conversation endpoint
    ai-feedback/            # Feedback generation endpoint
    ai-model/               # AI model configuration
    send-feedback-email/    # Email delivery endpoint
components/
  UserMenu.jsx              # Avatar dropdown (Profile, Logout)
  AuthGuard.jsx             # Protects dashboard routes
  VideoRecorder.jsx         # Candidate video capture
  CandidatePhotoCapture.jsx
  LoadingSpinner.jsx
services/
  supabaseClient.js         # Supabase client singleton
  Constants.jsx             # Shared constants (sidebar options, etc.)
lib/                        # Utility helpers (auth, storage, performance)
context/                    # React context providers
database/                   # SQL setup scripts and guide
```

---

## Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/auth?mode=signin` | Sign In |
| `/auth?mode=signup` | Sign Up / Get Started |
| `/dashboard` | Main dashboard |
| `/dashboard/create-interview` | Create a new practice session |
| `/dashboard/all-interview` | All available practice sessions |
| `/scheduled-interview` | Your interview history |
| `/interview/[id]/start` | Live AI voice interview |
| `/interview/[id]/completed` | Post-session results |
| `/profile` | User profile |

---

## Scripts

```bash
npm run dev      # Start development server on port 3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Deployment

Deploy instantly with [Vercel](https://vercel.com):

1. Push your repository to GitHub
2. Import the project in the Vercel dashboard
3. Add all `.env.local` variables under Vercel → Settings → Environment Variables
4. Deploy

Update `NEXT_PUBLIC_HOST_URL` to your production domain after deploying.

---

## License

[MIT](LICENSE)
