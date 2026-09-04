# FormPilot

A Chrome extension + web dashboard that autofills job application forms from a profile you set up once.

I built this because I was tired of retyping the same details (name, address, links, education, work history) into a different form on every job board. FormPilot stores your profile and resumes in one place, detects application forms on the page, and fills them in one click.

## What it does

**Chrome extension**
- Detects job application forms on a page using a few heuristics, no per-site config
- Autofills detected fields from your stored profile
- Lets you pick which resume to use before filling
- Falls back to a manual "scan this page" trigger for forms it misses automatically
- Only shows its floating button when it actually finds a form

**Web dashboard**
- One form to fill in your profile once (personal, professional, education)
- Upload multiple resumes, mark one as primary
- Logs every fill with the site URL, timestamp, and status
- Google sign-in, no separate password

Tested against Greenhouse, Lever, Workday, iCIMS, Taleo, SmartRecruiters, BambooHR, and LinkedIn Easy Apply, plus most custom career pages that use standard HTML forms.

## Stack

- Backend: Python, FastAPI, Supabase
- Web dashboard: Next.js 14, Tailwind CSS, Supabase Auth
- Extension: TypeScript, Manifest V3, Webpack
- Storage: Supabase Storage for files, Postgres for data

## Running it locally

Requires Python 3.11+, Node 18+, and a free Supabase project.

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local`, then fill in your Supabase credentials.

Run this in the Supabase SQL editor to set up the schema:

```sql
-- User profiles (extends auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text, last_name text, full_name text,
  email text, phone text,
  address_line1 text, city text, state text, zip_code text, country text,
  linkedin_url text, github_url text, portfolio_url text,
  current_title text, years_experience integer, current_company text,
  degree text, major text, university text, graduation_year integer, gpa text,
  cover_letter_template text, salary_expectation text, availability text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- Resume documents
create table resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null, file_path text not null, file_size integer,
  mime_type text, is_primary boolean default false,
  created_at timestamptz default now()
);

-- Job application log
create table applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  company_name text, job_title text, job_url text not null,
  status text default 'applied', resume_id uuid references resumes(id),
  applied_at timestamptz default now(), notes text
);

-- Row-level security
alter table profiles enable row level security;
alter table resumes enable row level security;
alter table applications enable row level security;

create policy "Users manage own profile" on profiles for all using (auth.uid() = id);
create policy "Users manage own resumes" on resumes for all using (auth.uid() = user_id);
create policy "Users manage own applications" on applications for all using (auth.uid() = user_id);

-- Auto-create a profile row on signup
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

Then create a private Storage bucket named `resumes`.

```bash
# Backend
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev

# Extension
cd extension && npm install && npm run build
# load extension/dist as an unpacked extension in Chrome
```

## License

MIT
