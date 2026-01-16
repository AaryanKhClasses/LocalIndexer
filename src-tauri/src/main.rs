// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod crawler;
mod db;
mod actions;
mod indexer_metadata;

use std::path::PathBuf;
use crawler::crawl;

use crate::{actions::{dispatch::execute_action, target::ActionTarget}, db::{index_sources::{IndexSource, add_source, list_sources, remove_source}, open_db, queries::{FolderRow, list_folders}}, indexer_metadata::{index_file, index_folder}};

#[tauri::command]
fn ping() -> String {
    "pong".to_string()
}

#[tauri::command]
async fn index_path(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let path = path.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let conn = open_db(&app).map_err(|e| e.to_string())?;
        let root = PathBuf::from(&path).canonicalize().map_err(|e| e.to_string())?;
        let folder_id = index_folder(&conn, &root).map_err(|e| e.to_string())?;

        let files = crawl(&root, true, &vec![
            "**/node_modules/**".into(),
            "**/.git/**".into()
        ]);

        for file in files {
            index_file(&conn, &file.path, folder_id).map_err(|e| e.to_string())?;
        }

        Ok::<(), String>(())
    }).await.map_err(|e| e.to_string())??;

    Ok(())
}

#[tauri::command]
fn run_action(action_id: String, path: String, is_folder: bool) -> Result<(), String> {
    let target = if is_folder { ActionTarget::Folder(path.into()) }
    else { ActionTarget::File(path.into()) };

    execute_action(&action_id, target)
}

#[tauri::command]
fn get_folders(app: tauri::AppHandle) -> Result<Vec<FolderRow>, String> {
    let conn = open_db(&app).map_err(|e| e.to_string())?;
    list_folders(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_index_sources(app: tauri::AppHandle) -> Result<Vec<IndexSource>, String> {
    let conn = open_db(&app).map_err(|e| e.to_string())?;
    list_sources(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_index_source(app: tauri::AppHandle, path: String, recursive: bool) -> Result<(), String> {
    let conn = open_db(&app).map_err(|e| e.to_string())?;
    add_source(&conn, path, recursive).map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_index_source(app: tauri::AppHandle, source_id: i64) -> Result<(), String> {
    let conn = open_db(&app).map_err(|e| e.to_string())?;
    remove_source(&conn, source_id).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![ping, index_path, run_action, get_folders, get_index_sources, add_index_source, remove_index_source])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
