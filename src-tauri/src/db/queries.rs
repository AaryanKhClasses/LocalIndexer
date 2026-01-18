use rusqlite::Connection;

#[derive(serde::Serialize)]
pub struct FolderRow {
    pub id: i64,
    pub name: String,
    pub folder_type: String,
    pub path: String,
    pub folder_type_locked: bool,
}

pub fn list_folders(conn: &Connection) -> rusqlite::Result<Vec<FolderRow>> {
    let mut statement = conn.prepare(
        "SELECT id, name, folder_type, path, folder_type_locked FROM folders ORDER BY id DESC"
    )?;

    let rows = statement.query_map([], |row| {
        Ok(FolderRow {
            id: row.get(0)?,
            name: row.get(1)?,
            folder_type: row.get(2)?,
            path: row.get(3)?,
            folder_type_locked: row.get::<_ , i64>(4)? == 1
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    Ok(rows)
}

pub fn add_folder(conn: &Connection, name: &str, folder_type: &str, path: &str) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT INTO folders (name, folder_type, path) VALUES (?1, ?2, ?3)",
        rusqlite::params![name, folder_type, path],
    )?;
    Ok(())
}

pub fn set_folder_type(conn: &Connection, id: i64, folder_type: &str, lock_type: bool) -> rusqlite::Result<()> {
    conn.execute(
        "UPDATE folders SET folder_type = ?1, folder_type_locked = ?2 WHERE id = ?3",
        rusqlite::params![folder_type, lock_type as i32, id],
    )?;
    Ok(())
}

pub fn update_folder_type(conn: &Connection, id: i64, folder_type: &str) -> rusqlite::Result<()> {
    conn.execute(
        "UPDATE folders SET folder_type = ?1 WHERE id = ?2",
        rusqlite::params![folder_type, id],
    )?;
    Ok(())
}

pub fn remove_folder(conn: &Connection, id: i64) -> rusqlite::Result<()> {
    conn.execute(
        "DELETE FROM folders WHERE id = ?1",
        rusqlite::params![id],
    )?;
    Ok(())
}
