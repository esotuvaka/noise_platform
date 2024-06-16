use std::fs;

use cpal::traits::{DeviceTrait, HostTrait};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::errors::CustomError;
use crate::{files, SettingsState};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KeybindSetting {
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
    pub audio_settings: Vec<KeybindSetting>,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_settings(
    state: State<'_, SettingsState>,
) -> Result<Vec<KeybindSetting>, CustomError> {
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
        .find(|setting: &&mut KeybindSetting| setting.filename == file_name)
    {
        existing_setting.letter = keybind.to_lowercase().to_owned();
        existing_setting.user_volume = user_volume;
        existing_setting.listener_volume = listener_volume;
        dbg!(existing_setting);
    } else {
        audio_settings.push(KeybindSetting {
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
    state: State<'_, SettingsState>,
) -> Result<(), CustomError> {
    println!("Saving audio devices");

    let mut settings_state = state.settings_state.lock().unwrap();
    settings_state.input_device = input_device;
    settings_state.output_device = output_device;

    let settings_file = files::get_sounds_folder()?.join("settings.json");

    let settings_string = serde_json::to_string_pretty(&*settings_state)?;
    fs::write(settings_file, settings_string)?;

    Ok(())
}
