use std::path::Path;
use rusqlite::Connection;
use crate::{config::{folder_types::FolderTypeConfig, load_config}, db::queries::{FolderRow, update_folder_type}};

pub fn detect_folder_type(path: &Path, types: &[FolderTypeConfig]) -> String {
    for t in types {
        let Some(rule) = &t.detect else { continue; };
        let any_ok = rule.any.as_ref().map(|list| {
            list.iter().any(|p| path.join(p).exists())
        }).unwrap_or(true);

        let all_ok = rule.all.as_ref().map(|list| {
            list.iter().all(|p| path.join(p).exists())
        }).unwrap_or(true);

        if any_ok && all_ok {
            return t.id.clone();
        }
    }

    "unknown".to_string()
}

pub fn redetect_folder_types(conn: &Connection, app: &tauri::AppHandle, folders: &[FolderRow]) -> rusqlite::Result<()> {
    let config = load_config(app);

    for folder in folders {
        if folder.folder_type_locked { continue; }

        let path = Path::new(&folder.path);
        if !path.exists() { continue; }

        let detected = detect_folder_type(path, &config.types);
        if detected != folder.folder_type {
            update_folder_type(conn, folder.id, &detected)?;
        }
    }

    Ok(())
}
