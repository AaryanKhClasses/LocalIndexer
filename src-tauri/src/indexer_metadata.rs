use std::{fs, path::Path, time::{SystemTime, UNIX_EPOCH}};
use rusqlite::{Connection, params};

fn to_unix(ts: SystemTime) -> i64 {
    ts.duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

pub fn index_folder(conn: &Connection, path: &Path) -> rusqlite::Result<i64> {
    let meta = path.metadata().map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    let name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_else(|| {
        path.to_string_lossy().to_string()
    });
    let modified = to_unix(meta.modified().unwrap_or(SystemTime::UNIX_EPOCH));

    conn.execute(
        "INSERT OR IGNORE INTO folders (path, name, folder_type, last_modified)
        VALUES (?1, ?2, 'Unknown', ?3)",
        params![path.to_string_lossy(), name, modified]
    )?;

    let id: i64 = conn.query_row(
        "SELECT id FROM folders WHERE path = ?1",
        params![path.to_string_lossy()],
        |row| row.get(0)
    )?;

    Ok(id)
}

pub fn index_file(conn: &Connection, path: &Path, folder_id: i64) -> rusqlite::Result<()> {
    let meta = fs::metadata(path).map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    let modified = to_unix(meta.modified().unwrap_or(SystemTime::UNIX_EPOCH));
    let name = path.file_name().unwrap().to_string_lossy().to_string();
    let ext = path.extension().map(|e| e.to_string_lossy().to_string());

    conn.execute(
        "INSERT OR IGNORE INTO files
        (path, name, extension, last_modified, size, folder_id)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            path.to_string_lossy(),
            name,
            ext,
            modified,
            meta.len() as i64,
            folder_id
        ]
    )?;

    Ok(())
}
