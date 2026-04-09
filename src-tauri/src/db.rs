pub const INIT_SQL: &str = r#"
CREATE TABLE IF NOT EXISTS tasks (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    timer_mode  TEXT NOT NULL CHECK(timer_mode IN ('countup', 'countdown')),
    duration    INTEGER,
    color       TEXT DEFAULT '#18a058',
    icon        TEXT DEFAULT '',
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    is_deleted  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS focus_records (
    id              TEXT PRIMARY KEY,
    task_id         TEXT NOT NULL,
    start_time      TEXT NOT NULL,
    end_time        TEXT,
    duration        INTEGER NOT NULL DEFAULT 0,
    break_duration  INTEGER NOT NULL DEFAULT 0,
    is_manual       INTEGER NOT NULL DEFAULT 0,
    note            TEXT DEFAULT '',
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE INDEX IF NOT EXISTS idx_focus_records_task_id ON focus_records(task_id);
CREATE INDEX IF NOT EXISTS idx_focus_records_start_time ON focus_records(start_time);
CREATE INDEX IF NOT EXISTS idx_focus_records_is_deleted ON tasks(is_deleted);
"#;
