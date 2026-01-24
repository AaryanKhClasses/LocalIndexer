use std::path::Path;
use rusqlite::Connection;
use crate::{config::{folder_types::FolderTypeConfig, load_config}, db::queries::{FolderRow, update_folder_type}};
use walkdir::WalkDir;
use globset::Glob;

pub fn detect_folder_type(path: &Path, types: &[FolderTypeConfig]) -> String {
    for t in types {
        let Some(rule) = &t.detect else { continue; };
        let any_ok = rule.any.as_ref().map(|list| {
            list.iter().any(|p| {
                if p.contains('*') || p.contains('?') || p.contains('[') {
                   if let Ok(glob) = Glob::new(p) {
                        let matcher = glob.compile_matcher();
                        for entry in WalkDir::new(path).into_iter().filter_map(Result::ok) {
                            if let Ok(rel) = entry.path().strip_prefix(path) {
                                if matcher.is_match(rel) {
                                    return true;
                                }
                            }
                        }
                    }
                    false
                } else { path.join(p).exists() }
            })
        }).unwrap_or(true);

        let all_ok = rule.all.as_ref().map(|list| {
            list.iter().all(|p| {
                if p.contains('*') || p.contains('?') || p.contains('[') {
                    if let Ok(glob) = Glob::new(p) {
                        let matcher = glob.compile_matcher();
                        let mut found = false;
                        for entry in WalkDir::new(path).into_iter().filter_map(Result::ok) {
                            if let Ok(rel) = entry.path().strip_prefix(path) {
                                if matcher.is_match(rel) {
                                    found = true;
                                    break;
                                }
                            }
                        }
                        found
                    } else { false }
                } else { path.join(p).exists() }
            })
        }).unwrap_or(true);

        if any_ok && all_ok { return t.id.clone(); }
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
