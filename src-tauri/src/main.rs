// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod actions;
mod folder_type;
mod config;

use std::path::PathBuf;
use crate::{actions::dispatch::execute_action, config::{folder_types::{AppPublic, FolderTypePublic}, load_config}, db::{open_db, queries::{FolderRow, list_folders}}, folder_type::{detect_folder_type, redetect_folder_types}};

#[tauri::command]
fn ping() -> String {
    "pong".to_string()
}

#[tauri::command]
fn run_action(app: tauri::AppHandle, action_id: String, path: String) -> Result<(), String> {
    let target = PathBuf::from(&path);
    let config = load_config(&app);
    let app_config = config.apps.iter().find(|a| a.id == action_id)
        .ok_or_else(|| format!("Unknown app id: {action_id}"))?;

    execute_action(app_config, &target)
}

#[tauri::command]
fn get_folders(app: tauri::AppHandle) -> Result<Vec<FolderRow>, String> {
    let conn = open_db(&app).map_err(|e| e.to_string())?;
    let folders = list_folders(&conn).map_err(|e| e.to_string())?;
    redetect_folder_types(&conn, &app, &folders).map_err(|e| e.to_string())?;
    list_folders(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_folder(app: tauri::AppHandle, name: String, path: String) -> Result<(), String> {
    let conn = db::open_db(&app).map_err(|e| e.to_string())?;
    let folder_path = PathBuf::from(&path);
    let config = load_config(&app);
    let folder_type = detect_folder_type(&folder_path, &config.types);
    db::queries::add_folder(&conn, &name, &folder_type, &path).map_err(|e| e.to_string())
}

#[tauri::command]
fn override_folder_type(app: tauri::AppHandle, id: i64, folder_type: String) -> Result<(), String> {
    let conn = db::open_db(&app).map_err(|e| e.to_string())?;
    db::queries::set_folder_type(&conn, id, &folder_type, true).map_err(|e| e.to_string())
}

#[tauri::command]
fn unlock_folder_type(app: tauri::AppHandle, id: i64) -> Result<(), String> {
    let conn = db::open_db(&app).map_err(|e| e.to_string())?;
    db::queries::set_folder_type(&conn, id, "unknown", false).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_folder_apps(app: tauri::AppHandle, id: i64, apps: Vec<String>) -> Result<(), String> {
    let conn = db::open_db(&app).map_err(|e| e.to_string())?;
    db::queries::update_folder_apps(&conn, id, &apps).map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_folder(app: tauri::AppHandle, id: i64) -> Result<(), String> {
    let conn = db::open_db(&app).map_err(|e| e.to_string())?;
    db::queries::remove_folder(&conn, id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_folder_type_config(app: tauri::AppHandle) -> Vec<FolderTypePublic> {
    load_config(&app).types.iter().map(|t| t.to_public()).collect()
}

#[tauri::command]
fn get_app_config(app: tauri::AppHandle) -> Vec<AppPublic> {
    load_config(&app).apps.iter().map(|a| a.to_public()).collect()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![ping, run_action, get_folders, add_folder, override_folder_type, unlock_folder_type, update_folder_apps, remove_folder, get_folder_type_config, get_app_config])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
