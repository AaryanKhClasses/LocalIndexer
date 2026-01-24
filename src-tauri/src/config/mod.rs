use std::{collections::HashSet, fs::read_to_string, sync::OnceLock};
use serde_json::from_str;
use tauri::Manager;
use crate::config::folder_types::FolderTypesFile;

pub mod folder_types;

static CONFIG: OnceLock<FolderTypesFile> = OnceLock::new();

pub fn load_config(app: &tauri::AppHandle) -> &'static FolderTypesFile {
    CONFIG.get_or_init(|| {
        let path = app.path().resolve("config.json", tauri::path::BaseDirectory::Resource).expect("Failed to resolve config.json path");
        let text = read_to_string(&path).expect("Failed to read config.json");
        let parsed = from_str(&text).expect("Invalid config.json format");
        validate_config(&parsed);
        parsed
    })
}

fn validate_config(config: &FolderTypesFile) {
    let mut seen_types = HashSet::new();
    let mut seen_apps = HashSet::new();

    for t in &config.types {
        if !seen_types.insert(&t.id) {
            panic!("Duplicate folder type ID found in config: {}", t.id);
        }
    }

    if !seen_types.contains(&"unknown".to_string()) {
        panic!("Missing required 'unknown' folder type in config");
    }

    for app in &config.apps {
        if app.id.trim().is_empty() {
            panic!("App entries must have a non-empty id");
        }

        if app.command.trim().is_empty() {
            panic!("App entries must have a non-empty command (id: {})", app.id);
        }

        if !seen_apps.insert(&app.id) {
            panic!("Duplicate app ID found in config: {}", app.id);
        }
    }
}
