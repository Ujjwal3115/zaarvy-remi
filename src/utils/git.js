import { execSync } from 'child_process';
import path from 'path';

export function getProjectNameFromGit(cwd = process.cwd()) {
  try {
    const url = execSync('git config --get remote.origin.url', { cwd, encoding: 'utf8' }).trim();
    if (url) {
      const match = url.match(/\/([^\/]+)\.git$/) || url.match(/:([^\/]+)\.git$/) || url.match(/\/([^\/]+)$/);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (e) {
    // Fallback to folder basename
  }
  return path.basename(cwd);
}

// Extract meaningful tech stack & domain keywords, ignoring clutter (git, feat, fix, import)
export function extractTechStackFromCommit(commitMsg) {
  const tags = new Set();
  const lower = commitMsg.toLowerCase();

  const techMapping = [
    { key: 'react', label: 'React' },
    { key: 'node', label: 'Node.js' },
    { key: 'd3', label: 'D3.js' },
    { key: 'sqlite', label: 'SQLite' },
    { key: 'supabase', label: 'Supabase' },
    { key: 'ollama', label: 'Ollama' },
    { key: 'openai', label: 'OpenAI' },
    { key: 'groq', label: 'Groq' },
    { key: 'gemini', label: 'Gemini' },
    { key: 'anthropic', label: 'Anthropic' },
    { key: 'auth', label: 'Authentication' },
    { key: 'api', label: 'REST API' },
    { key: 'ui', label: 'UI/UX' },
    { key: 'docker', label: 'Docker' },
    { key: 'python', label: 'Python' },
    { key: 'cli', label: 'CLI' },
    { key: 'powerpoint', label: 'PPTX Engine' },
    { key: 'pptx', label: 'PPTX Engine' },
    { key: 'llm', label: 'AI/LLM' },
    { key: 'rag', label: 'RAG Architecture' },
    { key: 'badge', label: 'UI Badges' },
    { key: 'session', label: 'Session History' },
    { key: 'attachment', label: 'Email Attachments' },
    { key: 'markdown', label: 'Markdown' }
  ];

  for (const item of techMapping) {
    if (lower.includes(item.key)) {
      tags.add(item.label);
    }
  }

  return Array.from(tags);
}

// Clean raw git commit messages into clean title summaries
export function cleanCommitMessage(msg) {
  if (!msg) return 'Work Update';
  return msg
    .replace(/^\[Git [^\]]+\]\s*/i, '')
    .replace(/^(feat|fix|docs|style|refactor|test|chore|perf|build|ci)(\([^\)]+\))?:\s*/i, '')
    .trim();
}
