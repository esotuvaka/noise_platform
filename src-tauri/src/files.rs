use std::fs;
use std::path::{Path, PathBuf};
use tauri::api::{dialog::FileDialogBuilder, file, path::desktop_dir};

use crate::errors::FilesError;
use crate::settings::SettingsFile;

#[tauri::command]
pub async fn open_sounds_folder() -> Result<(), FilesError> {
    FileDialogBuilder::new()
        .set_directory(get_sounds_folder_path()?)
        .set_title("Add .mp3, .wav, .vorbis, or .flac sound clips here!")
        .pick_file(|_file_path| {});

    Ok(())
}

pub fn get_sounds_folder_path() -> Result<PathBuf, FilesError> {
    if let Some(desktop) = desktop_dir() {
        let sounds_folder_path: PathBuf = Path::new(&desktop).join("Noise Platform Sounds");
        if !sounds_folder_path.is_dir() {
            std::fs::create_dir(&sounds_folder_path).map_err(|_| FilesError::CreateSoundsFolder)?;
        }

        Ok(sounds_folder_path)
    } else {
        Err(FilesError::DesktopDir)
    }
}

pub fn get_settings() -> Result<SettingsFile, FilesError> {
    println!("Getting settings file");

    let settings_file_path = get_sounds_folder_path()?.join("settings.json");
    if !settings_file_path.exists() {
        fs::write(&settings_file_path, "").map_err(|_| FilesError::CreateSettingsFile)?;
    }

    let settings_content =
        file::read_string(&settings_file_path).map_err(|_| FilesError::ReadSettingsFile)?;
    let settings_file: SettingsFile =
        serde_json::from_str(&settings_content).map_err(|_| FilesError::DeserializeSettingsFile)?;

    Ok(settings_file)
}
