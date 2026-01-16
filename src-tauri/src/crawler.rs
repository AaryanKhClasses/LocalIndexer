use std::path::{Path, PathBuf};
use std::time::SystemTime;
use walkdir::WalkDir;
use serde::Serialize;
use globset::{Glob, GlobSetBuilder};

#[derive(Serialize)]
pub struct FileRecord {
	pub path: PathBuf,
	pub size: u64,
	pub modified: SystemTime,
	pub extension: Option<String>
}

pub fn crawl(root: &Path, recursive: bool, ignore: &[String]) -> Vec<FileRecord> {
	let mut ignore_set = GlobSetBuilder::new();
	for pattern in ignore {
		ignore_set.add(Glob::new(pattern).unwrap());
	}

	let ignore_set = ignore_set.build().unwrap();
	let mut records = Vec::new();

	let walker = if recursive {  WalkDir::new(root) }
	else { WalkDir::new(root).max_depth(1) };

	for entry in walker.into_iter().filter_map(Result::ok) {
		let path = entry.path();
		if ignore_set.is_match(path) { continue; }

		if entry.file_type().is_file() {
			if let Ok(metadata) = entry.metadata() {
				records.push(FileRecord {
					path: path.to_path_buf(),
					size: metadata.len(),
					modified: metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH),
					extension: path.extension().map(|e| e.to_string_lossy().to_string())
				})
			}
		}
	}

	records
}
