# Zaarvy REMI: Comprehensive Website & Documentation Guide

This document is the **master source of truth** for building the `zaarvy/packages/remi` landing page and the `zaarvy/packages/remi/documentation` pages. It contains all marketing copy, feature details, architecture, and exact technical instructions needed for the main Zaarvy website.

---

## PART 1: LANDING PAGE COPY (`/packages/remi`)

### 1. Hero Section
- **Headline:** Autonomous Project Memory & Interactive Work Graph
- **Sub-headline:** Never forget what you built. REMI autonomously tracks your coding history via Git hooks, logs your work using natural language AI, and generates stunning interactive knowledge graphs of your entire developer journey.
- **CTA Buttons:** 
  - [Install via NPM (`npm i -g zaarvy-remi`)]
  - [Read the Documentation]

### 2. The Core Problem REMI Solves
Developers constantly switch context, juggle multiple projects, and forget what they worked on yesterday or 3 months ago.
- No more manually writing down boring work logs.
- No more struggling to remember accomplishments for daily morning standups.
- No more losing track of what tech stack was used in which repository.

### 3. Key Features Showcase (For Landing Page Grid)
1. **AI-Powered Natural Language Logging:** Just tell REMI what you did in plain English. The built-in AI (Google Gemini, Groq, Anthropic, OpenAI, Ollama) instantly parses the project name, clean action summary, and tech stack tags.
2. **Auto-Sync Git Commits:** Instantly pull your past 50+ commits from any local repository. REMI detects the technologies used and logs them automatically.
3. **Interactive D3 Knowledge Graph:** Generate a stunning, drag-and-drop glassmorphic physics graph showing the intricate connections between your projects, technologies, and timelines.
4. **1-Click Standup Reports:** Instantly generate perfectly formatted Daily or Weekly standup reports for Slack, Discord, or Jira.
5. **Developer Stats & Heatmap:** Gamify your workflow with coding streaks, top technology progress bars, and a GitHub-style 30-day ASCII activity heatmap right in your terminal.
6. **Cloud Sync via Supabase:** Work across multiple machines? REMI natively supports live syncing to Supabase (PostgreSQL) so your project memory is always backed up to the cloud.

### 4. Brand & Design Tokens
- **Primary Color:** Electric Lime / Yellow (`#D0D02D`)
- **Theme:** Dark mode, Terminal Aesthetic, Retro 8-Bit, Glassmorphism for web graphs.
- **Mascot:** The 8-Bit Retro Space Invader Mascot (Alien). Used seamlessly in the terminal UI header `REMI [Mascot]` and in desktop notification popups.
- **Tone:** Clean, professional, minimal, completely emoji-free (we use ASCII symbols like `[--]`, `[*]`, `[>>]`, `[##]` for terminal UI).

---
---

## PART 2: DETAILED DOCUMENTATION (`/packages/remi/documentation`)

### 1. Overview & Architecture
**REMI** (Recursive Engineering Memory Interface) is a Node.js-based CLI application. 
- **Local Mode:** Uses `better-sqlite3` with Full-Text Search (FTS5) for instant local querying.
- **Cloud Mode:** Natively integrates with `@supabase/supabase-js` for real-time Postgres cloud syncing.
- **AI Routing:** Features a robust `Multi-Model Fallback Router` (e.g., trying `gemini-2.5-flash`, then `gemini-2.0-flash`, etc.) to guarantee 100% uptime for AI parsing.
- **Desktop Daemons:** Uses native OS APIs (`node-notifier`) to push background desktop reminders without keeping a heavy terminal window open.

---

### 2. Installation & Quick Start

**Global Installation via NPM:**
```bash
npm install -g zaarvy-remi
```
*(Mac/Linux users may need `sudo npm install -g zaarvy-remi` or to use `pnpm add -g zaarvy-remi`)*

**Run without installing (NPX):**
```bash
npx zaarvy-remi setup
```

> **Note:** Once installed, you can use the command `remi` or `zaarvy-remi` interchangeably.

---

### 3. First-Time Setup (Database & AI)
Run the interactive setup wizard:
```bash
remi setup
```
1. **Choose Database:** 
   - **Local (SQLite)**: Zero-config, stored locally on your machine at `~/.remi/remi.db`.
   - **Cloud (Supabase)**: Multi-device sync (requires Supabase URL and Anon Key).
2. **Choose AI Provider:**
   - Google Gemini, Ollama (Local/Private), Groq, OpenAI, Anthropic, or Strict Mode (No AI).

---

### 4. Full Command Reference

#### A. Log Work (`remi log`)
**AI Natural Language Mode:**
```bash
remi log "Integrated Stripe checkout webhooks in the Billing App"
```
*(REMI automatically detects project="Billing App", tags=["Stripe", "webhooks", "payments"], action="Integrated Stripe checkout webhooks")*

**Strict Flag Mode (No AI needed):**
```bash
remi log -p "Zaarvy Engine" -m "Added SQLite FTS5 index" -t "db, sqlite, search"
```

#### B. Auto-Sync Git History (`remi sync`)
Inside any git repository:
```bash
remi sync
# Or limit to 100 commits:
remi sync --limit 100
```
*(Automatically extracts commit messages, determines tech stack from context, and backfills your REMI database.)*

#### C. Interactive Knowledge Graph (`remi graph`)
```bash
remi graph
```
*(Generates an `output_graph.html` and opens it in your default browser. Features light/dark mode, zoom/pan physics, and a sliding detail sidebar for every node.)*

#### D. Standup Generator (`remi standup`)
```bash
remi standup           # Last 24 hours
remi standup --days 7  # Last 7 days
remi standup -d 3 -p "MyProject" # Filter by specific project
```

#### E. Developer Stats & Heatmap (`remi stats`)
```bash
remi stats
```
*(Displays Current Streak, Total Logs, Top 5 Technologies progress bars, and a 30-day ASCII activity heatmap `[ ░ ▒ ▓ █ ]`.)*

#### F. Full-Text Search (`remi search`)
```bash
remi search "Stripe"
remi search "authentication"
```
*(Instantly queries months of work logs using SQLite FTS5 or Supabase ILIKE queries.)*

#### G. Desktop Daemon Reminders (`remi schedule`)
```bash
remi schedule -i 2     # Send a notification every 2 hours
remi schedule -m 15    # Send a notification every 15 minutes
remi schedule --test   # Test the native desktop notification immediately
```

#### H. Auto Git Hooks (`remi hook`)
```bash
remi hook install
remi hook uninstall
```
*(Automatically runs `remi log` in the background every time you run `git commit` in your project, achieving true 100% autonomous tracking.)*

#### I. Markdown Export (`remi export`)
```bash
remi export -p "Zaarvy Engine"
```
*(Exports a clean `.md` file of every task ever completed for a specific project.)*

---

### 5. Supabase Cloud Sync (Full Setup & SQL Schema)

If users wish to sync REMI across multiple computers or team members, they can link it to a free Supabase PostgreSQL database.

**Step 1:** Create a free project at [Supabase.com](https://supabase.com).
**Step 2:** Get the Project URL and Anon Public API Key.
**Step 3:** Run the following SQL script in the Supabase SQL Editor:

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

**Step 4:** Run `remi setup` in the terminal, select "Cloud (Supabase)", and paste the URL and Key. From that moment on, all commands (`graph`, `log`, `sync`, `stats`, `standup`) instantly read/write to the cloud.

---

### 6. Technical Stack & Dependencies (For the Docs)
- **Language:** JavaScript / Node.js (ESM Modules).
- **CLI Framework:** `commander` (for parsing args) & `inquirer` (for interactive setup).
- **Local DB:** `better-sqlite3` (ultra-fast synchronous local database).
- **Cloud DB:** `@supabase/supabase-js`.
- **UI / Styling:** `chalk` (for `#D0D02D` hex colors and terminal formatting).
- **Notifications:** `node-notifier` (cross-platform native OS toast notifications).
- **Knowledge Graph:** `D3.js` (Force-directed graphs, injected into a standalone HTML template).

**AI Multi-Model Fallback Router:**
REMI natively guarantees reliability. If the user selects Google Gemini and the default `gemini-2.5-flash` model endpoint is down or returning a 404, REMI will autonomously catch the error and fall back to `gemini-2.0-flash`, then `gemini-1.5-flash-latest`, then `gemini-pro`. 

---

### End of Documentation
*(Use the content above to populate both the high-converting landing page and the deep technical documentation sub-pages on the Zaarvy website!)*
