use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct FolderTypesFile {
    pub types: Vec<FolderTypeConfig>
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct FolderTypePublic {
    pub id: String,
    pub label: String,
    pub icon: String
}

#[derive(Debug, Deserialize, Clone)]
pub struct FolderTypeConfig {
    pub id: String,
    pub label: String,
    pub icon: String,
    pub detect: Option<DetectRule>
}

#[derive(Debug, Deserialize, Clone)]
pub struct DetectRule {
    pub any: Option<Vec<String>>,
    pub all: Option<Vec<String>>
}

impl FolderTypeConfig {
    pub fn to_public(&self) -> FolderTypePublic {
        FolderTypePublic {
            id: self.id.clone(),
            label: self.label.clone(),
            icon: self.icon.clone()
        }
    }
}
