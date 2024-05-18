use std::fs;
use std::sync::Mutex;

use cpal::traits::{DeviceTrait, HostTrait};
use serde::{Deserialize, Serialize};
use tauri::api::file;
use tauri::{Manager, State};

use crate::errors::CustomError;
use crate::{files, SettingsState};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Setting {
    pub filename: String,
    pub letter: String,
    #[serde(rename = "userVolume")]
    pub user_volume: f32,
    #[serde(rename = "listenerVolume")]
    pub listener_volume: f32,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsFile {
    pub input_device: String,
    pub output_device: String,
    pub audio_settings: Vec<Setting>,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_settings(state: State<'_, SettingsState>) -> Result<Vec<Setting>, CustomError> {
    println!("Loading settings");

    let settings_state = state.settings_state.lock().unwrap();
    let audio_settings = settings_state.audio_settings.clone();

    Ok(audio_settings)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn save_setting(
    file_name: String,
    keybind: String,
    user_volume: f32,
    listener_volume: f32,
    state: State<'_, SettingsState>,
) -> Result<(), CustomError> {
    println!("Saving setting for {}", file_name.clone());

    let mut settings_state = state.settings_state.lock().unwrap();
    let audio_settings = &mut settings_state.audio_settings;

    if let Some(existing_setting) = audio_settings
        .iter_mut()
        .find(|setting: &&mut Setting| setting.filename == file_name)
    {
        existing_setting.letter = keybind.to_lowercase().to_owned();
        existing_setting.user_volume = user_volume;
        existing_setting.listener_volume = listener_volume;
        dbg!(existing_setting);
    } else {
        audio_settings.push(Setting {
            filename: file_name.to_owned(),
            letter: keybind.to_lowercase().to_owned(),
            user_volume,
            listener_volume,
        });
    }

    let settings_file = files::get_sounds_folder()?.join("settings.json");

    let settings_string = serde_json::to_string_pretty(&*settings_state)?;
    fs::write(settings_file, settings_string)?;

    Ok(())
}

// Need to globally set the audio devices to be used in every play_sound function call.
// This function will be called from the settings page, and the selected devices will be saved to the settings file.
// The settings file will be read on app startup, and the selected devices will be set as the default devices if there's no overrides in the settings file
#[tauri::command(rename_all = "snake_case")]
pub async fn load_audio_devices() -> Result<(Vec<String>, Vec<String>), CustomError> {
    println!("Loading audio devices");

    let host = cpal::default_host();

    let input_devices = host
        .input_devices()
        .map_err(|e| CustomError::Error(e.to_string()))?
        .map(|device| device.name().unwrap_or("".to_owned()))
        .collect();

    let output_devices = host
        .output_devices()
        .map_err(|e| CustomError::Error(e.to_string()))?
        .map(|device| device.name().unwrap_or("".to_owned()))
        .collect();

    Ok((input_devices, output_devices))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn save_audio_devices(
    input_device: String,
    output_device: String,
    app: tauri::AppHandle,
) -> Result<(), CustomError> {
    println!("Saving audio devices");

    let sounds_folder = files::get_sounds_folder()?;
    let settings_file_path = sounds_folder.join("settings.json");

    if !settings_file_path.exists() {
        fs::write(&settings_file_path, "")?;
    }

    let settings_content = file::read_string(&settings_file_path)?;
    let mut settings_file: SettingsFile = serde_json::from_str(&settings_content)?;

    settings_file.input_device = input_device.clone();
    settings_file.output_device = output_device.clone();

    let state_mutex = app.state::<Mutex<SettingsFile>>();
    let mut state = state_mutex.lock().unwrap();

    state.input_device = input_device;
    state.output_device = output_device;

    let settings_string = serde_json::to_string_pretty(&settings_file)?;
    fs::write(settings_file_path, settings_string)?;

    Ok(())
}
