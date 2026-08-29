# [REMI] Zaarvy REMI: Complete Tester Guide & Product Documentation

> **Autonomous Project Memory & Interactive Work Graph CLI**  
> *Track work history, auto-sync Git commits, generate instant AI standups, and visualize your developer knowledge graph.*

---

## [--] What is REMI?

**REMI** (*Recursive Engineering Memory Interface*) is a developer tool designed to solve a universal developer problem: **"What did I actually build yesterday, last week, or 3 months ago?"**

Instead of manually maintaining boring work logs, trying to remember what you coded for morning standups, or losing track of tech stacks across multiple repositories:
- **REMI autonomously remembers your work** via Git commits and natural language logging.
- **REMI generates visual knowledge graphs** connecting your projects, technologies, and contributors.
- **REMI creates 1-click standup reports** formatted for Slack, Discord, and team meetings.
- **REMI tracks your coding streak & stats** with a terminal activity heatmap.

---

## [>>] 1. Quick Installation Guide (All Platforms)

### For Windows:
```bash
npm install -g zaarvy-remi
```

### For macOS / Linux:
```bash
sudo npm install -g zaarvy-remi
```
*(Or use PNPM: `pnpm add -g zaarvy-remi`)*

### Run Without Installing (NPX):
```bash
npx zaarvy-remi setup
```

> **Note:** Once installed, you can type **`remi`** or **`zaarvy-remi`** interchangeably in your terminal!

---

## [##] 2. First-Time Setup (30 Seconds)

Run the interactive setup wizard:
```bash
remi setup
```

You will be asked two quick questions:
1. **Database Storage:**
   - **Local (SQLite)** *(Recommended)* — Zero setup, stored securely on your machine.
   - **Cloud (Supabase)** — If you want cloud syncing across multiple devices.
2. **AI Provider for Natural Language Parsing:**
   - Choose **Google Gemini**, **Ollama (Local)**, **Groq**, **OpenAI**, **Anthropic**, or **Strict Mode (No AI)**.

---

## [**] 3. Core Features & How to Test Each One

Here is a step-by-step test walkthrough of all the features:

### [--] Test 1: Log Your Work (`remi log`)

You can log work in two ways:

#### A. Natural Language Mode (AI-Powered)
Just describe what you did in plain English. REMI's AI router automatically extracts the project name, clean action summary, and tech tags:
```bash
remi log "Integrated Stripe checkout and webhooks in ShopApp"
remi log "Fixed responsive navbar bug on landing page using Tailwind and React"
remi log "Trained YOLOv8 model for 50 epochs with 94% accuracy"
```

#### B. Strict Flag Mode (Explicit, No AI required)
If you prefer explicit values without using an AI API:
```bash
remi log -p "Zaarvy Engine" -m "Added SQLite FTS5 search index" -t "db, sqlite, search"
```

---

### [--] Test 2: Auto-Sync Past Git Commits (`remi sync`)

Open any existing Git repository in your terminal and run:
```bash
remi sync
```
- REMI automatically detects your Git remote repository name.
- It scans your past 50 commits, extracts the commit messages, identifies the technologies used (e.g. `React`, `Docker`, `API`, `CSS`), and imports them into your memory database.
- To import more commits: `remi sync --limit 100`

---

### [--] Test 3: Interactive Visual Knowledge Graph (`remi graph`)

Run:
```bash
remi graph
```
- Opens a **D3 force-directed visual knowledge graph** in your web browser.
- **Features to try:**
  - [*] **Light / Dark Mode Toggle** (Bottom-left sun/moon button).
  - [*] **Zoom & Pan Controls** (`+`, `-`, reset).
  - [*] **Click on any Project / Tech / Contributor Node** to slide open the detail sidebar showing recent accomplishments and timestamps.
  - [*] **Drag & physics forces** to interact with nodes.

---

### [--] Test 4: Generate Standup Reports (`remi standup`)

When it's time for team standup or updating your manager:
```bash
# Daily Standup (Last 24 Hours)
remi standup

# Weekly Summary (Last 7 Days)
remi standup --days 7

# Project-Specific Standup
remi standup -d 3 -p "MyProject"
```
Outputs a clean, bulleted report with accomplishments, next steps, and blockers formatted for copy-pasting directly into Slack or Discord.

---

### [--] Test 5: Developer Streak & Stats Dashboard (`remi stats`)

Run:
```bash
remi stats
```
Displays:
- [*] **Active Coding Streak** (consecutive logging days).
- [*] **Total Work Logs & Projects Tracked**.
- [*] **Top Technologies Progress Bars** (e.g., React, Python, Docker).
- [*] **30-Day Terminal Activity Heatmap** (`░ ▒ ▓ █`).

---

### [--] Test 6: Lightning-Fast Full-Text Search (`remi search`)

Search through months of past work logs instantly:
```bash
remi search "Stripe"
remi search "authentication"
remi search "database"
```

---

### [--] Test 7: Background Desktop Reminders (`remi schedule`)

Never forget to log your work:
```bash
# Test desktop notification right now:
remi schedule --test

# Schedule a reminder daemon every 2 hours:
remi schedule -i 2

# Quick 2-minute test interval:
remi schedule -m 2
```

---

## [??] 4. Tester Feedback Questionnaire

When sharing this with testers, ask them these 5 quick questions:

1. **Installation:** Did `npm install -g zaarvy-remi` install smoothly on your OS (Windows / Mac / Linux)?
2. **AI Logging:** Did `remi log "..."` correctly identify your project name, action, and tech tags?
3. **Knowledge Graph:** How did the D3 graph look on your browser? Did the Light/Dark mode and sidebar work well?
4. **Standup Generator:** Would this format be helpful for your daily Slack/Discord standup updates?
5. **Suggestions / Wishlist:** What feature would you like to see next (e.g., VS Code extension, GitHub Actions sync, Jira integration, export to PDF)?

---

---

## [++] 5. Setting Up Supabase Cloud Sync (Optional)

If you or your team want to sync your project memory across multiple machines or team members, you can use **Supabase (PostgreSQL)** instead of local SQLite.

### Step 1: Create a Free Supabase Project
1. Go to **[https://supabase.com](https://supabase.com)** and create a new project.
2. Go to **Project Settings** > **API** and copy:
   - **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - **`anon` `public` API Key** (e.g. `eyJhbGciOi...`)

### Step 2: Create the Required Tables
Open the **SQL Editor** in your Supabase Dashboard, paste the following SQL script, and click **Run**:

```sql
-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Work Logs Table
CREATE TABLE IF NOT EXISTS work_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    action_summary TEXT NOT NULL,
    tags TEXT,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Entities Table (for graph relations)
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, type)
);

-- 4. Create Graph Edges Table
CREATE TABLE IF NOT EXISTS graph_edges (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) & Allow Access
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on work_logs" ON work_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on entities" ON entities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on graph_edges" ON graph_edges FOR ALL USING (true) WITH CHECK (true);
```

### Step 3: Connect REMI to Supabase
Run the setup wizard on your computer:
```bash
remi setup
```
1. Select **Cloud (Supabase - sync across devices)**.
2. Enter your **Supabase Project URL**.
3. Enter your **Supabase anon public API key**.

Now, every time you run `remi log` or `remi sync`, your work history will automatically sync to your Supabase cloud database!

---

## [//] License & Links

- **NPM Package:** [https://www.npmjs.com/package/zaarvy-remi](https://www.npmjs.com/package/zaarvy-remi)
- **GitHub Repository:** [https://github.com/Ujjwal3115/zaarvy-remi](https://github.com/Ujjwal3115/zaarvy-remi)
- **Website:** [https://zaarvy.in](https://zaarvy.in)
- **Author:** Zaarvy Ecosystem (<contact@zaarvy.in>)
