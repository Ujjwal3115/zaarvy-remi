import { extractTechStackFromCommit, cleanCommitMessage } from '../src/utils/git.js';

describe('Git Utility Functions', () => {
  describe('extractTechStackFromCommit', () => {
    test('extracts multiple tech tags from commit messages', () => {
      const tags = extractTechStackFromCommit('feat(auth): integrate Supabase and React UI login');
      expect(tags).toContain('Authentication');
      expect(tags).toContain('Supabase');
      expect(tags).toContain('React');
      expect(tags).toContain('UI/UX');
    });

    test('extracts AI/LLM tags', () => {
      const tags = extractTechStackFromCommit('refactor: update gemini router and ollama fallback');
      expect(tags).toContain('Gemini');
      expect(tags).toContain('Ollama');
    });

    test('returns empty array when no tech keywords present', () => {
      const tags = extractTechStackFromCommit('bump version number');
      expect(tags).toEqual([]);
    });
  });

  describe('cleanCommitMessage', () => {
    test('removes conventional commit prefixes', () => {
      expect(cleanCommitMessage('feat(ui): add dark mode toggle')).toBe('add dark mode toggle');
      expect(cleanCommitMessage('fix: resolve memory leak')).toBe('resolve memory leak');
      expect(cleanCommitMessage('docs: update README guide')).toBe('update README guide');
    });

    test('handles fallback when message is empty', () => {
      expect(cleanCommitMessage('')).toBe('Work Update');
      expect(cleanCommitMessage(null)).toBe('Work Update');
    });
  });
});
