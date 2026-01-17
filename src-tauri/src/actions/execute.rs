use std::{path::Path, process::Command};

pub fn open_vscode(path: &Path) -> Result<(), String> {
    Command::new("cmd").args(["/C", "code-insiders"]).arg(path).spawn().map_err(|e| e.to_string())?;
    Ok(())
}

pub fn open_explorer(path: &Path) -> Result<(), String> {
    Command::new("explorer").arg(path).spawn().map_err(|e| e.to_string())?;
    Ok(())
}
