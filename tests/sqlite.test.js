import { getDatabase } from '../src/db/sqlite.js';
import fs from 'fs';
import path from 'path';

describe('Universal SQLite Adapter', () => {
  test('getDatabase returns a valid constructor', () => {
    const Database = getDatabase();
    expect(typeof Database).toBe('function');
  });

  test('Database executes schema and performs queries', () => {
    const Database = getDatabase();
    const db = new Database(':memory:');

    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);

    // Test insert with RETURNING
    const insertProj = db.prepare('INSERT INTO projects (id, name) VALUES (?, ?) RETURNING id');
    const res = insertProj.get('p-test', 'Universal Project');
    expect(res.id).toBe('p-test');

    // Test work log insert
    const insertLog = db.prepare(
      'INSERT INTO work_logs (id, project_id, action_summary, tags) VALUES (?, ?, ?, ?)'
    );
    insertLog.run('w-test', 'p-test', 'Universal adapter verification', 'sqlite,test');

    // Test select
    const log = db.prepare('SELECT * FROM work_logs WHERE id = ?').get('w-test');
    expect(log.action_summary).toBe('Universal adapter verification');

    // Test FTS search
    const ftsResults = db.prepare('SELECT * FROM work_logs_fts WHERE work_logs_fts MATCH ?').all('adapter');
    expect(ftsResults.length).toBeGreaterThan(0);
    expect(ftsResults[0].project_name).toBe('Universal Project');

    db.close();
  });
});
