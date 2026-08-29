<div align="center">

```text
██████╗ ███████╗███╗   ███╗██╗
██╔══██╗██╔════╝████╗ ████║██║
██████╔╝█████╗  ██╔████╔██║██║
██╔══██╗██╔══╝  ██║╚██╔╝██║██║
██║  ██║███████╗██║ ╚═╝ ██║██║
╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝

   v1.0.0  REMI CLI • Autonomous Project Memory & Work Graph
  A Zaarvy Ecosystem Package
```

**Track work history, auto-sync Git commits, generate AI standup reports, and visualize your project knowledge graph.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Zaarvy Ecosystem](https://img.shields.io/badge/A_Zaarvy_Package-%23D0D02D)](https://zaarvy.in)
</div>

---

##  Key Features

- ** Dual-Mode Logging (`zaarvy-remi log`):** Log work using natural language parsed by AI (Ollama / Gemini / Groq / OpenAI / Anthropic) or strict flags (`-p`, `-m`, `-t`).
- **️ Glassmorphic Knowledge Graph (`zaarvy-remi graph`):** Interactive D3 force-directed visual graph showing connections between **Projects**, **Tech Stacks**, and **Contributors**. Features **Light & Dark themes**, canvas zoom controls, and a slide-out detail panel!
- ** Smart Git Sync (`zaarvy-remi sync`):** Automatically parse and import past repository commits, extracting meaningful tech tags (`React`, `SQLite`, `Ollama`, `API`) and author handles.
- ** AI Standup Generator (`zaarvy-remi standup`):** Instant Daily/Weekly status report generator for Slack, Discord, or team meetings.
- ** Developer Dashboard (`zaarvy-remi stats`):** Terminal coding streak counter, top tech progress bars, and 30-day ASCII activity heatmap.
- ** Full-Text Search (`zaarvy-remi search`):** Fast local SQLite FTS5 search across all past project logs.
- ** Dual Backend Storage:** Choose between **Local SQLite** (default) or **Cloud Supabase** database.
- ** Proactive Desktop Reminders (`zaarvy-remi schedule`):** Silent background daemon that alerts you if you forget to log work.
- ** Beautiful TUI Dashboard:** Seamless CLI experience with animated progress states, responsive block-art headers, and signature Zaarvy formatting!

---

##  Installation & Setup

### Install globally via NPM
```bash
npm install -g zaarvy-remi
```

### Run Setup Wizard
```bash
zaarvy-remi setup
```
*(Configure database preferences & local/cloud AI providers with full `<- Back` navigation).*

---

##  Usage & Commands

| Command | Description |
| :--- | :--- |
| `zaarvy-remi setup` | Run the interactive setup wizard for DB & AI preferences. |
| `zaarvy-remi log "Built login UI using React"` | Log work using natural language AI parsing. |
| `zaarvy-remi log -p "My Project" -m "Summary" -t "tag1, tag2"` | Log work in Strict Flag mode. |
| `zaarvy-remi graph` | Open the interactive D3 Knowledge Graph in your browser. |
| `zaarvy-remi sync --limit 50` | Import past Git commits into REMI memory. |
| `zaarvy-remi standup --days 7` | Generate a Daily or Weekly Standup report. |
| `zaarvy-remi stats` | View active coding streak, top tech stats & ASCII heatmap. |
| `zaarvy-remi search "auth"` | Full-Text Search across all past work logs. |
| `zaarvy-remi export -p "My Project"` | Export project log history to Markdown. |
| `zaarvy-remi hook install` | Install Git `post-commit` auto-logging hook in current repo. |

---

## ️ Technical Architecture

REMI is built entirely around developer workflow speed:
- **TUI & Command Parsing:** Commander.js, Inquirer.js, Chalk for responsive, glowing 2D pixel-art terminals.
- **AI Router Engine:** LangChain orchestration supporting local LLMs (Ollama) to cloud APIs (Gemini, Groq, OpenAI).
- **Data Layer:** `better-sqlite3` with Full-Text Search 5 (FTS5) for blazing fast local searches, and `@supabase/supabase-js` for optional cloud syncing.
- **Interactive Visuals:** D3.js v7 for force-directed web visualizations spawned locally.

---

## ️ License

[MIT](LICENSE)  [Zaarvy Ecosystem](https://zaarvy.in)
