use std::path::PathBuf;
use crate::actions::{execute::{open_explorer, open_vscode}};

pub fn execute_action(action_id: &str, path: &PathBuf) -> Result<(), String> {
    match (action_id, path) {
        ("open_vscode", path) => open_vscode(&path),
        ("open_explorer", path) => open_explorer(&path),
        ("open_default", path) => open::that(path).map_err(|e| e.to_string()),
        _ => Err("Unknown action or incompatible target".to_string()),
    }
}
