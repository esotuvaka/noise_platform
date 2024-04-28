use crate::errors::CustomError;
use std::path::{Path, PathBuf};
use tauri::api::{dialog::FileDialogBuilder, path::desktop_dir};

#[tauri::command]
pub fn open_sounds_folder() -> Result<(), CustomError> {
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
