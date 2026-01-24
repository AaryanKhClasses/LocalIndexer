use std::{path::Path, process::Command};

pub fn run_app_command(command: &str, path: &Path) -> Result<(), String> {
    let path_str = path.to_string_lossy();

    let constructed = if command.contains("{path}") {
        command.replace("{path}", &path_str)
    } else {
        format!("{} \"{}\"", command, path_str)
    };

    Command::new("cmd")
        .args(["/C", &constructed])
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}
