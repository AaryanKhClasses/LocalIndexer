use std::fs;
use rusqlite::{Connection, Result};
use tauri::{AppHandle, Manager};

pub mod queries;

pub fn open_db(app: &AppHandle) -> Result<Connection> {
    let dir = app.path().app_data_dir().map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    fs::create_dir_all(&dir).map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
    let db_path = dir.join("local_search.db");
    
    let conn = Connection::open(db_path)?;
    conn.execute_batch(include_str!("schema.sql"))?;
    Ok(conn)
}
