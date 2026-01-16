use rusqlite::Connection;

#[derive(serde::Serialize)]
pub struct FolderRow {
    pub id: i64,
    pub path: String,
    pub name: String,
    pub folder_type: String,
    pub last_modified: i64
}

pub fn list_folders(conn: &Connection) -> rusqlite::Result<Vec<FolderRow>> {
    let mut statement = conn.prepare(
        "SELECT id, path, name, folder_type, last_modified
        FROM folders
        ORDER BY last_modified DESC"
    )?;

    let rows = statement.query_map([], |row| {
        Ok(FolderRow {
            id: row.get(0)?,
            path: row.get(1)?,
            name: row.get(2)?,
            folder_type: row.get(3)?,
            last_modified: row.get(4)?
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    Ok(rows)
}
