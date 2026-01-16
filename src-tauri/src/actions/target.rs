use std::path::PathBuf;

#[derive(Debug, Clone)]
pub enum ActionTarget {
    Folder(PathBuf),
    File(PathBuf)
}
