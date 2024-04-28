use crate::errors::CustomError;
use serde::{Deserialize, Serialize};
use std::{
    fs::{self},
    path::PathBuf,
};
use tauri::api::{file, path::desktop_dir};

#[derive(Debug, Serialize, Deserialize)]
pub struct Setting {
    pub filename: String,
    pub letter: String,
    pub volume: f32,
}

#[tauri::command(rename_all = "snake_case")]
pub fn load_settings() -> Result<Vec<Setting>, CustomError> {
    let desktop = desktop_dir().ok_or(CustomError::Error(
        "Unable to find desktop directory".to_string(),
    ))?;

    let settings_file = PathBuf::from(&desktop)
        .join("Noise Platform Sounds")
        .join("settings.json");

    if !settings_file.exists() {
        fs::write(&settings_file, "")?;
    }

    let settings_content = file::read_string(settings_file)?;
    let settings: Vec<Setting> = serde_json::from_str(&settings_content)?;

    Ok(settings)
}

#[tauri::command(rename_all = "snake_case")]
pub fn save_setting(file_name: String, keybind: String, volume: f32) -> Result<(), CustomError> {
    let desktop = desktop_dir().ok_or(CustomError::Error(
        "Unable to find desktop directory".to_string(),
    ))?;

    let settings_file = PathBuf::from(&desktop)
        .join("Noise Platform Sounds")
        .join("settings.json");

    if !settings_file.exists() {
        fs::write(&settings_file, "")?;
    }

    let file_content = file::read_string(&settings_file).unwrap_or_else(|_| String::new());
    let mut settings: Vec<Setting> =
        serde_json::from_str(&file_content).unwrap_or_else(|_| Vec::new());

    if let Some(existing_setting) = settings
        .iter_mut()
        .find(|setting: &&mut Setting| setting.filename == file_name)
    // Borrowing the mutable reference to the setting
    {
        existing_setting.letter = keybind.to_lowercase().to_owned();
        existing_setting.volume = volume;
    } else {
        settings.push(Setting {
            filename: file_name.to_owned(),
            letter: keybind.to_lowercase().to_owned(),
            volume,
        });
    }

    let settings_string = serde_json::to_string_pretty(&settings)?;
    fs::write(&settings_file, settings_string)?;

    Ok(())
}
