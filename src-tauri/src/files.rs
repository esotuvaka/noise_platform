use std::fs;
use std::path::{Path, PathBuf};
use tauri::api::{dialog::FileDialogBuilder, file, path::desktop_dir};

use crate::errors::CustomError;
use crate::settings::SettingsFile;

#[tauri::command]
pub async fn open_sounds_folder() -> Result<(), CustomError> {
    let desktop = desktop_dir().ok_or(CustomError::Error(
        "Unable to find desktop directory".to_string(),
    ))?;

    let sounds_folder_path: PathBuf = Path::new(&desktop).join("Noise Platform Sounds");

    if !sounds_folder_path.is_dir() {
        std::fs::create_dir(&sounds_folder_path)?;
    }

    FileDialogBuilder::new()
        .set_directory(sounds_folder_path)
        .set_title("Add .mp3, .wav, .vorbis, or .flac sound clips here!")
        .pick_file(|_file_path| {});

    Ok(())
}

pub fn get_sounds_folder() -> Result<PathBuf, CustomError> {
    let desktop = desktop_dir().ok_or(CustomError::Error(
        "Unable to find desktop directory".to_string(),
    ))?;

    let sounds_folder_path: PathBuf = Path::new(&desktop).join("Noise Platform Sounds");

    if !sounds_folder_path.is_dir() {
        std::fs::create_dir(&sounds_folder_path)?;
    }

    Ok(sounds_folder_path)
}

pub fn get_settings() -> Result<SettingsFile, CustomError> {
    println!("Getting settings file");

    let settings_file_path = get_sounds_folder()?.join("settings.json");

    if !settings_file_path.exists() {
        fs::write(&settings_file_path, "")?;
    }

    let settings_content = file::read_string(&settings_file_path)?;
    let settings_file: SettingsFile = serde_json::from_str(&settings_content)?;

    Ok(settings_file)
}
