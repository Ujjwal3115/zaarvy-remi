CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, type)
);

CREATE TABLE IF NOT EXISTS work_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    action_summary TEXT NOT NULL,
    tags TEXT,
    source TEXT DEFAULT 'manual',
    log_date DATE DEFAULT (CURRENT_DATE),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS graph_edges (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- FTS5 Virtual Table for Search
CREATE VIRTUAL TABLE IF NOT EXISTS work_logs_fts USING fts5(
    log_id UNINDEXED, 
    action_summary,
    tags,
    project_name
);

CREATE TRIGGER IF NOT EXISTS work_logs_ai AFTER INSERT ON work_logs BEGIN
  INSERT INTO work_logs_fts(log_id, action_summary, tags, project_name) 
  VALUES (new.id, new.action_summary, new.tags, (SELECT name FROM projects WHERE id = new.project_id));
END;

CREATE TRIGGER IF NOT EXISTS work_logs_ad AFTER DELETE ON work_logs BEGIN
  DELETE FROM work_logs_fts WHERE log_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS work_logs_au AFTER UPDATE ON work_logs BEGIN
  DELETE FROM work_logs_fts WHERE log_id = old.id;
  INSERT INTO work_logs_fts(log_id, action_summary, tags, project_name) 
  VALUES (new.id, new.action_summary, new.tags, (SELECT name FROM projects WHERE id = new.project_id));
END;
