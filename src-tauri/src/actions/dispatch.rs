use super::{execute::open_in_explorer, execute::open_in_vscode, target::ActionTarget};

pub fn execute_action(action_id: &str, target: ActionTarget) -> Result<(), String> {
    match (action_id, target) {
        ("open_vscode", ActionTarget::Folder(path)) => open_in_vscode(&path),
        ("open_in_explorer", ActionTarget::Folder(path)) | ("open_in_explorer", ActionTarget::File(path)) => open_in_explorer(&path),
        ("open_default", ActionTarget::File(path)) => open::that(path).map_err(|e| e.to_string()),
        _ => Err("Unknown action or incompatible target".to_string()),
    }
}
