use std::path::PathBuf;
use crate::{actions::execute::run_app_command, config::folder_types::AppConfig};

pub fn execute_action(app: &AppConfig, path: &PathBuf) -> Result<(), String> {
    run_app_command(&app.command, path)
}
