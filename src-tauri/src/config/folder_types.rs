use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct FolderTypesFile {
    pub types: Vec<FolderTypeConfig>,
    pub apps: Vec<AppConfig>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct FolderTypePublic {
    pub id: String,
    pub label: String,
    pub icon: String
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AppPublic {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub default: bool,
}

#[derive(Debug, Deserialize, Clone)]
pub struct FolderTypeConfig {
    pub id: String,
    pub label: String,
    pub icon: String,
    pub detect: Option<DetectRule>
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AppConfig {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub command: String,
    pub default: bool,
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

impl AppConfig {
    pub fn to_public(&self) -> AppPublic {
        AppPublic {
            id: self.id.clone(),
            name: self.name.clone(),
            icon: self.icon.clone(),
            default: self.default,
        }
    }
}
