# BILLMUN Attendees Portal

A production-ready, full-stack conference management platform for the BILLMUN Model United Nations conference. Built with Next.js 14, Supabase PostgreSQL, Supabase Auth, and Groq AI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier supported)
- Groq API key
- Resend email service account

### Step 1: Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API**
3. Copy these values:
   - `NEXT_PUBLIC_SUPABASE_URL` - Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key

### Step 2: Create Database Tables

In Supabase SQL Editor, run this:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  password_hash VARCHAR(255),
  date_of_birth DATE,
  grade VARCHAR(50),
  phone_number VARCHAR(20),
  emergency_contact_name VARCHAR(255),
  emergency_contact_relation VARCHAR(50),
  emergency_contact_phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'DELEGATE',
  status VARCHAR(50) DEFAULT 'PENDING',
  approved_at TIMESTAMP,
  approved_by_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Committees table
CREATE TABLE committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(10) UNIQUE NOT NULL,
  topic TEXT,
  description TEXT,
  image_url VARCHAR(500),
  max_delegates INT DEFAULT 10,
  difficulty VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Committee assignments
CREATE TABLE committee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  committee_id UUID NOT NULL REFERENCES committees(id),
  country VARCHAR(100),
  seat_number VARCHAR(10),
  assigned_at TIMESTAMP DEFAULT now(),
  assigned_by_id UUID
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  committee_id UUID REFERENCES committees(id),
  type VARCHAR(50),
  title VARCHAR(255),
  file_url VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'PENDING',
  feedback TEXT,
  uploaded_at TIMESTAMP DEFAULT now(),
  reviewed_at TIMESTAMP,
  reviewed_by_id UUID
);

-- AI Feedback
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID UNIQUE NOT NULL REFERENCES documents(id),
  user_id UUID NOT NULL REFERENCES users(id),
  overall_score INT,
  argument_strength INT,
  research_depth INT,
  policy_alignment INT,
  writing_clarity INT,
  format_adherence INT,
  summary TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  suggestions TEXT[],
  annotated_segments JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  body TEXT,
  author_id UUID REFERENCES users(id),
  is_pinned BOOLEAN DEFAULT false,
  target_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(500),
  created_at TIMESTAMP DEFAULT now()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(255),
  target_type VARCHAR(100),
  target_id UUID,
  metadata JSONB,
  performed_at TIMESTAMP DEFAULT now()
);

-- Conference settings
CREATE TABLE conference_settings (
  id VARCHAR(1) PRIMARY KEY DEFAULT '1',
  conference_name VARCHAR(255),
  conference_date DATE,
  conference_location VARCHAR(255),
  registration_open BOOLEAN DEFAULT true,
  portal_message TEXT,
  updated_at TIMESTAMP DEFAULT now(),
  updated_by_id UUID
);
```

### Step 3: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

GROQ_API_KEY=your_groq_api_key_from https://console.groq.com
RESEND_API_KEY=your_resend_api_key_from https://resend.com
NEXTAUTH_SECRET=your_secret_for_cookies
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Install & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## 📋 Architecture

### Authentication Flow
1. User registers at `/register`
2. Supabase Auth creates user account
3. User profile created with `PENDING` status
4. User sees waiting screen at `/pending`
5. EB can go to `/911` to get 2-minute access to approve users
6. EB views pending registrations at `/eb/dash`
7. Click Approve/Reject to update status
8. User receives email notification (Resend)

### User Roles
- `DELEGATE` - Standard conference participant
- `CHAIR` - Committee chair
- `MEDIA` - Press/media personnel
- `EXECUTIVE_BOARD` - Conference organizers
- `ADMIN` - System administrators
- `SECRETARY_GENERAL` - Conference leader
- `DEPUTY_SECRETARY_GENERAL` - Deputy conference leader

### User Status
- `PENDING` - Awaiting EB approval
- `APPROVED` - Full portal access
- `REJECTED` - Access denied
- `SUSPENDED` - Temporarily blocked

## 🎨 Design

**Monochromatic Only**
- Colors: #080808 to #F0EDE6 (grays only)
- Playfair Display (titles) + Inter (text)
- 4px spacing grid
- No templates, all custom-built

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages
│   ├── dashboard/         # User dashboard
│   ├── committees/        # Committee listing
│   ├── documents/         # Document management
│   ├── ai-feedback/       # AI analysis
│   ├── eb/                # EB dashboard
│   │   └── dash/          # Overview, registrations, users, etc.
│   ├── api/               # API routes
│   │   └── eb/            # EB approval endpoints
│   └── 911/               # EB temp access
├── components/            # UI components
│   ├── icons.tsx         # SVG icons
│   ├── button.tsx        # Button component
│   ├── ui.tsx            # Form/display components
│   ├── navigation.tsx    # Top nav
│   └── eb-layout.tsx     # EB sidebar
├── lib/
│   ├── supabase.ts       # Client
│   ├── supabase-admin.ts # Server admin
│   ├── ai.ts             # Groq integration
│   └── email.ts          # Resend email
├── types/
│   └── database.types.ts # Supabase types
└── middleware.ts          # Auth middleware
```

## 🔧 API Endpoints

- `POST /api/auth/register` - (future: Supabase handles this)
- `POST /api/eb/approve-user` - Approve/reject user registration
- `GET /api/committees` - List committees
- `GET /api/users/me` - Current user profile

## 🤖 AI Integration

Uses Groq's open-source models for document analysis:
- Model: `mixtral-8x7b-32768`
- Analyzes position papers for 6 dimensions
- Returns scores 0-100 + annotations

Request `/api/ai/analyze` with document text.

## 📧 Email Integration

Via Resend - emails sent on:
- Registration confirmation
- Approval notification
- Rejection notification
- Other status changes

## 🚢 Deployment

### Hosting Options
- Vercel (recommended for Next.js)
- Netlify
- Self-hosted (any Node.js host)

### Environment
Supabase provides managed PostgreSQL, so no database setup needed.

### Build
```bash
npm run build
npm start
```

## 📞 Support

For Supabase: https://supabase.com/docs  
For Groq: https://console.groq.com/docs  
For Resend: https://resend.com/docs

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
