use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct IndexSource {
    pub id: i64,
    pub path: String,
    pub recursive: bool,
    pub include_patterns: Option<Vec<String>>,
    pub exclude_patterns: Option<Vec<String>>,
}

pub fn list_sources(conn: &Connection) -> rusqlite::Result<Vec<IndexSource>> {
    let mut statement = conn.prepare(
        "SELECT id, path, recursive, include_patterns, exclude_patterns FROM index_sources"
    )?;

    let rows = statement.query_map([], |row| {
        Ok(IndexSource {
            id: row.get(0)?,
            path: row.get(1)?,
            recursive: row.get::<_, i64>(2)? == 1,
            include_patterns: row.get::<_, Option<String>>(3)?.map(|s| serde_json::from_str(&s).unwrap_or_default()),
            exclude_patterns: row.get::<_, Option<String>>(4)?.map(|s| serde_json::from_str(&s).unwrap_or_default())
        })
    })?;

    Ok(rows.collect::<Result<_, _>>()?)
}

pub fn add_source(conn: &Connection, path: String, recursive: bool) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO index_sources
        (path, recursive)
        VALUES (?1, ?2)",
        params![path, recursive as i32]
    )?;
    Ok(())
}

pub fn remove_source(conn: &Connection, source_id: i64) -> rusqlite::Result<()> {
    conn.execute(
        "DELETE FROM index_sources WHERE id = ?1",
        params![source_id]
    )?;
    Ok(())
}
