My apologies\! It looks like the formatting or the code block got cut off and glitched out on your screen. That is incredibly frustrating when you just need the complete file to copy-paste.

I have removed any dividers that might have broken the formatting. Here is the **complete, uncut** Markdown file starting directly from Point 1\.

Copy this exact block and give it to Antigravity:

Markdown  
\# REMI: The Autonomous Project Memory & Work Graph CLI  
\#\# Complete NPM / Node.js Implementation Blueprint

\#\# 1\. System Overview & Agent Instructions

You are an expert Node.js CLI architect. Build **\*\*Remi\*\***—an open-source, local-first Project Memory & Work Graph CLI. 

\#\#\# Core Architecture (Dual-Mode):  
Remi operates in two distinct modes to satisfy both human users and AI coding agents:  
1\. **\*\*Strict Mode (Flag-Based, 100% Offline):\*\*** Bypasses LLMs entirely. Used primarily by AI agents to securely and instantly log data using explicit flags (e.g., \`-p "Project" \-m "Message"\`).  
2\. **\*\*NLP Mode (Natural Language):\*\*** Used by humans. Takes a raw string, sends it to a configured LLM (Local Ollama or Cloud API), and parses it into strict JSON intents.

\#\#\# Target Tech Stack:  
\- **\*\*CLI Framework:\*\*** \`commander\` (for strict flags), \`inquirer\` (for interactive setup), \`chalk\` (for terminal styling).  
\- **\*\*Database:\*\*** \`better-sqlite3\` (stores data locally at \`\~/.remi/remi.db\`).  
\- **\*\*AI Integrations:\*\*** Native fetch calls to Ollama (localhost:11434) and Groq/OpenAI.  
\- **\*\*Graphing:\*\*** Generates a standalone \`graph.html\` using embedded D3.js.

\#\# 2\. Directory Structure & Dependencies

Initialize the project using \`npm init \-y\` and configure \`"bin": { "remi": "./bin/remi.js" }\`.

**\*\*Dependencies to install:\*\***  
\`npm install commander inquirer better-sqlite3 chalk dotenv\`

**\*\*Project Structure:\*\***  
remi/  
├── package.json  
├── bin/  
│   └── remi.js                \# CLI entrypoint (\#\!/usr/bin/env node)  
├── src/  
│   ├── config/  
│   │   └── setup.js           \# Handles 'remi setup' and config.json  
│   ├── db/  
│   │   ├── schema.sql         \# Table definitions  
│   │   └── client.js          \# better-sqlite3 wrapper  
│   ├── ai/  
│   │   ├── router.js          \# Routes to Ollama or Cloud LLM  
│   │   └── prompts.js         \# System prompts for intent parsing  
│   ├── commands/  
│   │   ├── log.js             \# Strict OR NLP logging logic  
│   │   ├── import.js          \# Git history scanner  
│   │   ├── export.js          \# Brag-sheet generator  
│   │   └── graph.js           \# D3.js HTML generator  
│   └── templates/  
│       └── graph.html         \# Base D3.js HTML wrapper

\#\# 3\. Database Schema (\`src/db/schema.sql\`)

The database must be auto-initialized at \`\~/.remi/remi.db\` upon first execution.

\`\`\`sql  
CREATE TABLE IF NOT EXISTS config ( key TEXT PRIMARY KEY, value TEXT NOT NULL );

CREATE TABLE IF NOT EXISTS projects (  
    id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, category TEXT, status TEXT DEFAULT 'Active', created\_at DATETIME DEFAULT CURRENT\_TIMESTAMP  
);

CREATE TABLE IF NOT EXISTS entities (  
    id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, created\_at DATETIME DEFAULT CURRENT\_TIMESTAMP, UNIQUE(name, type)  
);

CREATE TABLE IF NOT EXISTS work\_logs (  
    id TEXT PRIMARY KEY, project\_id TEXT NOT NULL, action\_summary TEXT NOT NULL, tags TEXT, source TEXT DEFAULT 'manual', log\_date DATE DEFAULT (CURRENT\_DATE), created\_at DATETIME DEFAULT CURRENT\_TIMESTAMP, FOREIGN KEY(project\_id) REFERENCES projects(id)  
);

CREATE TABLE IF NOT EXISTS graph\_edges (  
    id TEXT PRIMARY KEY, source\_id TEXT NOT NULL, source\_type TEXT NOT NULL, target\_id TEXT NOT NULL, target\_type TEXT NOT NULL, relation\_type TEXT NOT NULL, created\_at DATETIME DEFAULT CURRENT\_TIMESTAMP  
);

## **4\. Phase-by-Phase Execution Plan**

### **Phase 1: CLI Scaffolding & Dual-Mode Router**

1. Setup the bin/remi.js file using commander.  
2.   
3. Implement the log command to accept BOTH a raw string AND optional flags (\-p, \-t, \-m).  
4.   
5. **Routing Logic:** If flags like \-p are present, immediately execute SQLite INSERTs (Strict Mode). If no flags are present, pass the raw string to the AI Router (NLP Mode).  
6. 

### **Phase 2: Setup Command & Config Manager**

1. Implement remi setup using inquirer.  
2.   
3. Ask the user for their preferred mode:  
4. 

   * \[1\] Strict Mode Only (No AI, 100% Offline)  
   *   
   * \[2\] Local AI (Ollama \- 100% Private) \-\> Ask for endpoint URL.  
   *   
   * \[3\] Cloud AI (Groq / OpenAI) \-\> Ask for API Key.  
   *   
5. Save preferences to \~/.remi/config.json.  
6. 

### **Phase 3: NLP AI Engine (The "Brain")**

1. Build src/ai/router.js.  
2.   
3. Create a strict system prompt demanding JSON output:  
4. { "intent": "LOG\_WORK", "project": "Name", "action": "Summary", "tags": \["tech/people"\] }  
5.   
6. Map the JSON response to the corresponding SQLite database insert functions.  
7. 

### **Phase 4: Data Outputs (Graph & Export)**

1. remi graph: Query all SQLite tables. Build a JSON object of nodes (projects, tech, people) and edges. Inject it into a local copy of templates/graph.html (which includes D3.js via CDN). Use the open (macOS) or start (Windows) command to open the HTML file.  
2.   
3. remi export \-p "Project": Fetch all work\_logs for a project and write them to a local Markdown file. (If AI is enabled, prompt the LLM to rewrite them into STAR-format bullets).  
4. 

### **Phase 5: Historical Git Importer**

1. Build remi import \<path\>.  
2.   
3. Execute git log \--pretty=format:"%h | %ad | %s" \--date=short via Node's child\_process.  
4.   
5. Feed commits to the SQLite database (using LLM summarization if NLP mode is enabled).  
6. 

## **5\. Antigravity Agent Operating Instructions**

Once the CLI is built, append these instructions to the AI Agent's system prompt (Antigravity config):  
Plaintext  
\#\#\# REMI LONG-TERM MEMORY PROTOCOL  
You have access to a local CLI tool called \`remi\` which manages long-term project memory.   
You MUST use STRICT MODE (flags) to ensure 100% reliability. Do not use natural language strings.

\- \*\*When you complete a major coding task, log it immediately:\*\*  
  \`remi log \-m "Implemented X feature" \-p "Project Name" \-t "Tech1, Tech2"\`  
\- \*\*When initializing a new repository:\*\*  
  \`remi init \-n "Project Name" \-c "Category"\`

