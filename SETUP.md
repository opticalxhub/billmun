# BILLMUN Portal - Complete Setup Guide

This guide will walk you through setting up the BILLMUN Attendees Portal from scratch with Supabase as the backend.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (create free at https://supabase.com)
- Groq API key (create free at https://console.groq.com)
- Resend account for emails (create free at https://resend.com)

## Step 1: Clone/Access the Project

```bash
cd billmn
npm install
```

## Step 2: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - Project name: `billmun`
   - Database password: (strong password)
   - Region: Choose closest to you
4. Click "Create new project" and wait 3-5 minutes
5. Once ready, go to **Settings → API**
6. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (Keep this SECRET!)

## Step 3: Create Database Tables

In Supabase:
1. Go to **SQL Editor** (left menu)
2. Click **New Query**
3. Paste this SQL:

```sql
-- Create ENUM types
CREATE TYPE user_role AS ENUM ('DELEGATE', 'CHAIR', 'MEDIA', 'EXECUTIVE_BOARD', 'ADMIN', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL');
CREATE TYPE user_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE document_type AS ENUM ('POSITION_PAPER', 'SPEECH', 'RESOLUTION');
CREATE TYPE document_status AS ENUM ('PENDING', 'APPROVED', 'NEEDS_REVISION', 'REJECTED');
CREATE TYPE notification_type AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');
CREATE TYPE difficulty AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

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
  role user_role DEFAULT 'DELEGATE',
  status user_status DEFAULT 'PENDING',
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
  difficulty difficulty,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Committee assignments
CREATE TABLE committee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  country VARCHAR(100),
  seat_number VARCHAR(10),
  assigned_at TIMESTAMP DEFAULT now(),
  assigned_by_id UUID,
  UNIQUE(user_id, committee_id)
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
  type document_type,
  title VARCHAR(255),
  file_url VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(50),
  status document_status DEFAULT 'PENDING',
  feedback TEXT,
  uploaded_at TIMESTAMP DEFAULT now(),
  reviewed_at TIMESTAMP,
  reviewed_by_id UUID
);

-- AI Feedback
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID UNIQUE NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  target_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  message TEXT,
  type notification_type,
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(500),
  created_at TIMESTAMP DEFAULT now()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255),
  target_type VARCHAR(100),
  target_id UUID,
  metadata JSONB,
  performed_at TIMESTAMP DEFAULT now()
);

-- Conference settings (singleton)
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

-- Create indexes for common queries
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_announcements_created ON announcements(created_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
```

4. Click **Run** button
5. Wait for success message

## Step 4: Set Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```
# From Supabase (Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Get from https://console.groq.com/keys
GROQ_API_KEY=gsk_your_groq_key

# Get from https://resend.com/api-keys
RESEND_API_KEY=re_your_resend_key

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your_random_secret_here

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Step 6: Register Your First Account (EB)

1. Click "Apply Now"
2. Fill out the form:
   - Name, email, password
   - Date of birth, grade
   - Phone & emergency contact
3. Click "Create Account"
4. You'll be on the "Pending Review" page

## Step 7: Approve Your Account (as EB)

The brilliant part: **You can approve yourself!**

1. In any browser tab (same device), visit: `http://localhost:3000/911`
2. You'll get a **2-minute temporary cookie** for EB dashboard access
3. You're taken to `/eb/dash` automatically
4. You'll see your account in "Pending Approvals" table
5. Click **Approve** button
6. Status changes to "APPROVED"
7. Email sent to you (if Resend is configured)
8. You now have full access!

## Step 8: Create Test Data (Optional)

To populate the database with test committees, run this in Supabase SQL Editor:

```sql
-- Insert test committees
INSERT INTO committees (name, abbreviation, topic, description, max_delegates, difficulty, is_active)
VALUES
  ('United Nations Security Council', 'UNSC', 'International Peace & Security', 'Maintaining international peace through security measures', 15, 'ADVANCED', true),
  ('UN Human Rights Council', 'UNHRC', 'Human Rights Violations', 'Addressing global human rights issues', 10, 'ADVANCED', true),
  ('Economic and Social Council', 'ECOSOC', 'Sustainable Development', 'Economic cooperation and development', 12, 'INTERMEDIATE', true),
  ('Disarmament & International Security', 'DISEC', 'Nuclear Proliferation', 'International weapons treaties', 10, 'ADVANCED', true),
  ('World Health Organization', 'WHO', 'Pandemic Response', 'Global health crises and responses', 8, 'BEGINNER', true),
  ('International Court of Justice', 'ICJ', 'Legal Disputes', 'Cases between nations', 6, 'ADVANCED', true);
```

## Key Routes

Once approved, you have access to:
- `/dashboard` - Main user dashboard with stats
- `/committees` - Browse all committees
- `/documents` - Upload & manage your documents
- `/ai-feedback` - Get AI analysis of your papers
- `/eb/dash` - EB dashboard (visible if you have EB role)
- `/911` - EB quick approval (2-minute access)

## Workflow

1. **User registers** → Created with `PENDING` status
2. **EB goes to /911** → Gets 2-minute temp access
3. **EB sees pending users** → Can approve/reject
4. **User gets email** → Resend sends notification
5. **User logs back in** → Now has `APPROVED` status
6. **Full portal access** → Dashboard, committees, documents, AI feedback

## Testing AI Feedback

1. Upload a document at `/documents` (any text file)
2. Go to `/ai-feedback`
3. Select your document
4. Click "Analyze Paper"
5. Groq AI analyzes it (takes ~5-10 seconds)
6. See scores, strengths, weaknesses, suggestions

## Troubleshooting

**"Cannot find Supabase variables"**
- Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and anon key
- Restart dev server: `npm run dev`

**"Email not sending"**
- Check RESEND_API_KEY is correct
- Emails are only sent if env var is set
- Check Resend dashboard for bounce logs

**"AI analysis returns error"**
- Verify GROQ_API_KEY is correct
- Check Groq console for rate limits
- Free tier: 30 requests per minute

**"Database connection error"**
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check tables exist in Supabase
- Make sure Region matches your setup

##Deploying to Production

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Other Hosts

1. Build: `npm run build`
2. Start: `npm start`
3. Set same environment variables
4. Ensure Node.js 18+ available

---

## Support

- **Supabase Issues**: https://supabase.com/docs
- **Groq Issues**: https://console.groq.com/docs
- **Resend Issues**: https://resend.com/docs
- **Next.js Issues**: https://nextjs.org/docs
