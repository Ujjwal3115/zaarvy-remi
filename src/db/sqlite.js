import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let cachedDatabaseClass = null;

/**
 * Returns a universal SQLite Database constructor:
 * 1. Prefers Node.js built-in `node:sqlite` (Node 22.5.0+, zero C++ compilation, zero external dependencies).
 * 2. Falls back to `better-sqlite3` for older Node.js LTS versions (Node 18/20).
 */
export function getDatabase() {
  if (cachedDatabaseClass) return cachedDatabaseClass;

  // 1. Try Node.js native built-in SQLite (Node 22.5.0+)
  try {
    const { DatabaseSync } = require('node:sqlite');
    cachedDatabaseClass = DatabaseSync;
    return cachedDatabaseClass;
  } catch (err) {
    // node:sqlite not available on older Node versions
  }

  // 2. Fall back to better-sqlite3 for Node 18/20
  try {
    const BetterSqlite = require('better-sqlite3');
    cachedDatabaseClass = BetterSqlite;
    return cachedDatabaseClass;
  } catch (err) {
    throw new Error(
      'No SQLite driver found.\n' +
      '• For zero-dependency SQLite, use Node.js >= 22.5.0.\n' +
      '• For older Node versions, install with prebuilt binaries or build tools.'
    );
  }
}
