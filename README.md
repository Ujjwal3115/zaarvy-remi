<div align="center">
  <img src="https://zaarvy.in/Subtract.png" alt="Remi 8-bit Mascot Logo" width="100" />
  <h1>Remi — Autonomous Developer Memory NPM Package</h1>
  <p><strong>The official Remi CLI package for automated Git tracking, standup generation, and interactive 2D D3 work graphs.</strong></p>

  <p>
    <a href="https://zaarvy.in"><img src="https://img.shields.io/badge/Official_Website-zaarvy.in-D0D02D?style=for-the-badge&logo=googlechrome&logoColor=black" alt="Website" /></a>
    <a href="https://zaarvy.in/packages/remi/docs"><img src="https://img.shields.io/badge/Docs-Remi_Documentation-111520?style=for-the-badge&logo=googledocs&logoColor=white" alt="Documentation" /></a>
    <a href="https://www.npmjs.com/package/zaarvy-remi"><img src="https://img.shields.io/npm/v/zaarvy-remi?style=for-the-badge&color=CB3837&logo=npm" alt="NPM Version" /></a>
    <a href="https://github.com/Ujjwal3115/zaarvy-remi"><img src="https://img.shields.io/github/stars/Ujjwal3115/zaarvy-remi?style=for-the-badge&color=white&logo=github" alt="GitHub Stars" /></a>
  </p>
</div>

---

## ⚡ What is the Remi Package?

**Remi** (`zaarvy-remi`) is an open-source, local-first developer memory CLI and knowledge graph engine created by [Zaarvy](https://zaarvy.in).

It solves developer memory loss by automatically capturing git commits, indexing decisions with embedded SQLite FTS5, generating ready-to-share daily standup summaries, and visualizing your entire stack topology in an interactive 2D D3 graph.

- 🌐 **Official Website**: [https://zaarvy.in](https://zaarvy.in)
- 📖 **Complete Documentation**: [https://zaarvy.in/packages/remi/docs](https://zaarvy.in/packages/remi/docs)
- 🏗️ **System Architecture**: [https://zaarvy.in/#architecture](https://zaarvy.in/#architecture)

---

## 🚀 Quick Install

Install the **Remi package** globally via npm:

```bash
npm install -g zaarvy-remi
```

Or run instantly without installing:

```bash
npx zaarvy-remi --help
```

---

## 🛠️ Core Remi Commands

| Command | Description |
| :--- | :--- |
| `remi sync` | Quietly intercepts git commits in the background, categorizing work into local SQLite memory. |
| `remi log "summary"` | Records an architectural decision using the multi-model AI routing cascade (or strict `-p` flag). |
| `remi standup` | Generates formatted daily standup markdown reports ready for Slack, Jira, or LinkedIn. |
| `remi graph` | Launches an interactive 2D D3 force-directed physics graph of your projects, git commits, and tech stacks. |

<div align="center">
  <img src="https://zaarvy.in/remi-graph-dark.png" alt="Zaarvy Remi Interactive 2D D3 Knowledge Graph" width="800" />
  <p><em>Interactive 2D D3 Force-Directed Work Graph generated with <code>remi graph</code></em></p>
</div>

---

## 🧠 Key Architectural Features

1. **Sub-2ms SQLite FTS5 Search**: All project logs, git trails, and tags are indexed locally in `~/.remi/remi.db` with BM25 vector ranking. Zero network latency by default.
2. **Autonomous AI Fallback Router**: Natural language parsing cascades across Gemini 2.5 Flash, Gemini 2.0, local Ollama, Groq, down to deterministic regex parsers with 100% uptime.
3. **Dual Cloud Synchronization**: Optional encrypted cloud sync with Supabase PostgreSQL for multi-machine workspace synchronization.

---

## 📚 Learn More & Documentation

Read the complete guides, CLI flag references, and API documentation:
- [Getting Started & Installation Guide](https://zaarvy.in/packages/remi/docs)
- [Local SQLite FTS5 Architecture](https://zaarvy.in/packages/remi/docs)
- [Supabase Cloud Sync Configuration](https://zaarvy.in/packages/remi/docs)

---

## 📄 License

MIT © [Zaarvy](https://zaarvy.in) • Created by [Ujjwal Verma](https://www.linkedin.com/in/ujjwalverma3115)
