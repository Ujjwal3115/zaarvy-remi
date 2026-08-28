# 🚀 zaarvy-remi

> **Autonomous Project Memory & Interactive Work Graph CLI**  
> *Track work history, auto-sync Git commits, generate AI standup reports, and visualize your project knowledge graph.*

---

## 🌟 Key Features

- **⚡ Dual-Mode Logging (`zaarvy-remi log`):** Log work using natural language parsed by AI (Ollama / Gemini / Groq / OpenAI / Anthropic) or strict flags (`-p`, `-m`, `-t`).
- **🕸️ Glassmorphic Knowledge Graph (`zaarvy-remi graph`):** Interactive D3 force-directed visual graph showing connections between **Projects**, **Tech Stacks**, and **Contributors**. Features **Light & Dark themes**, canvas zoom controls, and a slide-out detail panel!
- **⚡ Smart Git Sync (`zaarvy-remi sync`):** Automatically parse and import past repository commits, extracting meaningful tech tags (`React`, `SQLite`, `Ollama`, `API`) and author handles.
- **🚀 AI Standup Generator (`zaarvy-remi standup`):** Instant Daily/Weekly status report generator for Slack, Discord, or team meetings.
- **🔥 Developer Dashboard (`zaarvy-remi stats`):** Terminal coding streak counter, top tech progress bars, and 30-day ASCII activity heatmap.
- **🔍 Full-Text Search (`zaarvy-remi search`):** Fast local SQLite FTS5 search across all past project logs.
- **📦 Dual Backend Storage:** Choose between **Local SQLite** (default) or **Cloud Supabase** database.
- **🔔 Proactive Desktop Reminders (`zaarvy-remi schedule`):** Silent background daemon that alerts you if you forget to log work.

---

## 📦 Installation & Setup

### Install via NPM
```bash
npm install -g zaarvy-remi
```

### Run Setup Wizard
```bash
zaarvy-remi setup
```
*(Configure database preferences & local/cloud AI providers with full `<- Back` navigation).*

---

## 💻 Usage & Commands

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

## 🛡️ License

[MIT](LICENSE) © [Zaarvy](https://zaarvy.in)
