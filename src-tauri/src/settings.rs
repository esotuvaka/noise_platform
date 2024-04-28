use std::{
    fmt,
    fs::{self},
    io,
    path::PathBuf,
};

use serde::{Deserialize, Serialize};

use tauri::Error as TauriError;
use tauri::{
    api::{file, path::desktop_dir},
    InvokeError,
};

#[derive(Debug)]
pub enum CustomError {
    Error(String),
}
impl fmt::Display for CustomError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            CustomError::Error(msg) => write!(f, "Error: {}", msg),
        }
    }
}

// Convert errors to CustomError type for easier handling via ? operator
impl From<io::Error> for CustomError {
    fn from(error: io::Error) -> Self {
        CustomError::Error(error.to_string())
    }
}
impl From<serde_json::Error> for CustomError {
    fn from(error: serde_json::Error) -> Self {
        CustomError::Error(error.to_string())
    }
}
impl From<TauriError> for CustomError {
    fn from(error: TauriError) -> Self {
        CustomError::Error(error.to_string())
    }
}
impl From<CustomError> for InvokeError {
    fn from(error: CustomError) -> Self {
        InvokeError::from(error.to_string())
    }
}
impl From<tauri::api::Error> for CustomError {
    fn from(error: tauri::api::Error) -> Self {
        CustomError::Error(error.to_string())
    }
}

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

    if let Some(existing_setting) = settings.iter_mut().find(|kb| kb.filename == file_name) {
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
