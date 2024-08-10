use cpal::traits::{DeviceTrait, HostTrait};
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::State;

use crate::errors::{AppError, SettingsError};
use crate::{files, SettingsState};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KeybindSetting {
    pub filename: String,
    pub keybind: String,
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
    pub noise_settings: Vec<KeybindSetting>,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_settings_file() -> Result<SettingsFile, AppError> {
    println!("Loading settings");

    let sound_folder = files::get_sounds_folder_path()?;
    let settings_json_file = sound_folder.join("settings.json");
    let settings_string = fs::read_to_string(&settings_json_file).unwrap();
    let mut settings_file: SettingsFile =
        serde_json::from_str(&settings_string).map_err(|_| SettingsError::DeserializeSettings)?;

    let sound_files = files::get_sound_files(sound_folder);
    let new_settings: Vec<KeybindSetting> = sound_files
        .iter()
        .map(|file_name| {
            if let Some(existing_setting) = settings_file
                .noise_settings
                .iter_mut()
                .find(|setting: &&mut KeybindSetting| setting.filename == *file_name)
            {
                existing_setting.clone()
            } else {
                KeybindSetting {
                    filename: file_name.to_owned(),
                    keybind: "?".to_owned(),
                    user_volume: 1.0,
                    listener_volume: 1.0,
                }
            }
        })
        .collect();

    settings_file.noise_settings = new_settings;

    let settings_string = serde_json::to_string_pretty(&settings_file)
        .map_err(|_| SettingsError::SerializeSettings)?;
    fs::write(settings_json_file, settings_string).map_err(|_| SettingsError::WriteSettings)?;

    Ok(settings_file)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn save_setting(
    file_name: String,
    keybind: String,
    user_volume: f32,
    listener_volume: f32,
    app_state: State<'_, SettingsState>,
) -> Result<(), SettingsError> {
    println!("Saving setting for {}", file_name.clone());

    // TODO: Consolidate keybinds and audio devices load + save functions

    let sound_folder =
        files::get_sounds_folder_path().map_err(|_| SettingsError::LoadSoundsFolder)?;
    let settings_json_file = sound_folder.join("settings.json");
    let settings_string = fs::read_to_string(&settings_json_file).unwrap();
    let mut settings_file: SettingsFile =
        serde_json::from_str(&settings_string).map_err(|_| SettingsError::DeserializeSettings)?;

    let noise_settings = &mut settings_file.noise_settings;

    if let Some(existing_setting) = noise_settings
        .iter_mut()
        .find(|setting: &&mut KeybindSetting| setting.filename == file_name)
    {
        existing_setting.keybind = keybind.to_owned();
        existing_setting.user_volume = user_volume;
        existing_setting.listener_volume = listener_volume;
        dbg!(existing_setting);
    } else {
        noise_settings.push(KeybindSetting {
            filename: file_name.to_owned(),
            keybind: keybind.to_owned(),
            user_volume,
            listener_volume,
        });
    }

    // Save the settings to the app state
    let mut mutex_settings = app_state.settings_state.lock().unwrap();
    mutex_settings.noise_settings = noise_settings.to_vec();

    // Save the settings to the settings.json file
    let settings_string = serde_json::to_string_pretty(&settings_file)
        .map_err(|_| SettingsError::SerializeSettings)?;
    fs::write(settings_json_file, settings_string).map_err(|_| SettingsError::WriteSettings)?;

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_audio_devices() -> Result<(Vec<String>, Vec<String>), SettingsError> {
    println!("Loading audio devices");

    let host = cpal::default_host();
    let input_devices = host
        .input_devices()
        .map_err(|e| SettingsError::LoadAudioDevices(e.into()))?
        .map(|device| device.name().unwrap_or("".to_owned()))
        .collect();

    let output_devices = host
        .output_devices()
        .map_err(|e| SettingsError::LoadAudioDevices(e.into()))?
        .map(|device| device.name().unwrap_or("".to_owned()))
        .collect();

    Ok((input_devices, output_devices))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn save_audio_devices(
    input_device: String,
    output_device: String,
    state: State<'_, SettingsState>,
) -> Result<(), SettingsError> {
    println!("Saving audio devices");

    let mut settings_state = state.settings_state.lock().unwrap();
    settings_state.input_device = input_device;
    settings_state.output_device = output_device;

    let settings_file = files::get_sounds_folder_path()
        .map_err(|_| SettingsError::LoadSoundsFolder)?
        .join("settings.json");
    let settings_string = serde_json::to_string_pretty(&*settings_state)
        .map_err(|_| SettingsError::SerializeSettings)?;
    fs::write(settings_file, settings_string).map_err(|_| SettingsError::WriteSettings)?;

    Ok(())
}
