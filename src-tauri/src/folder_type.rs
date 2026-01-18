use std::path::Path;

use rusqlite::Connection;

use crate::db::queries::{FolderRow, update_folder_type};

#[derive(Debug)]
pub enum FolderType {
    NextJS,
    ReactNative,
    Kotlin,
    Flutter,
    MinecraftMod,
    Python,
    ChromeExtension,
    CPP,
    Typescript,
    Unknown
}

impl FolderType {
    pub fn as_str(&self) -> &'static str {
        match self {
            FolderType::NextJS => "next",
            FolderType::ReactNative => "react-native",
            FolderType::Kotlin => "kotlin",
            FolderType::Flutter => "flutter",
            FolderType::MinecraftMod => "minecraft",
            FolderType::Python => "python",
            FolderType::ChromeExtension => "chrome",
            FolderType::CPP => "cpp",
            FolderType::Typescript => "typescript",
            FolderType::Unknown => "unknown"
        }
    }
}

pub fn detect_folder_type(path: &Path) -> FolderType {
    if path.join(".next").exists()
        || path.join("next.config.js").exists()
        || path.join("next.config.mjs").exists()
        || path.join("next.config.ts").exists()        
    { return FolderType::NextJS; }

    if (path.join("pubspec.yaml").exists()
        || path.join("pubspec.lock").exists())
        && path.join("lib").exists()
    { return FolderType::Flutter; }

    if path.join("app.json").exists()
        && path.join("node_modules/react-native").exists()
    { return FolderType::ReactNative; }

    if path.join("mods.toml").exists()
        || path.join("src/main/resources/fabric.mod.json").exists()
        || path.join("META-INF/mods.toml").exists()
    { return FolderType::MinecraftMod; }

    if path.join("build.gradle").exists()
        || path.join("build.gradle.kts").exists()
        || path.join("settings.gradle").exists()
        || path.join("settings.gradle.kts").exists()
    { return FolderType::Kotlin; }

    if path.join("public/manifest.json").exists()
        && (path.join("src/background.ts").exists()
        || path.join("src/background.js").exists())
    { return FolderType::ChromeExtension; }

    if path.join("CMakeLists.txt").exists()
        || path.join("Makefile").exists()
    { return FolderType::CPP; }

    if path.join("requirements.txt").exists()
    { return FolderType::Python; }

    if path.join("tsconfig.json").exists()
        || path.join("package.json").exists()
    { return FolderType::Typescript; }

    FolderType::Unknown
}

pub fn redetect_folder_types(conn: &Connection, folders: &[FolderRow]) -> rusqlite::Result<()> {
    for folder in folders {
        if folder.folder_type_locked { continue; }
        let path = Path::new(&folder.path);
        if !path.exists() { continue; }
        let detected_type = detect_folder_type(path).as_str();
        if detected_type != folder.folder_type {
            update_folder_type(conn, folder.id, detected_type)?;
        }
    }
    Ok(())
}
