use crate::errors::CustomError;
use cpal::traits::{DeviceTrait, HostTrait};
use rdev::{listen, Event, EventType, Key};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, path::PathBuf};
use tauri::api::{file, path::desktop_dir};

use crate::sounds;

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

#[derive(Debug, Serialize, Deserialize)]
struct KeyState {
    alt_pressed: bool,
    other_key_pressed: bool,
    settings: Vec<Setting>,
}

impl KeyState {
    fn new() -> Self {
        Self {
            alt_pressed: false,
            other_key_pressed: false,
            settings: Vec::new(),
        }
    }

    fn string_to_key(s: &str) -> Option<Key> {
        match s.to_lowercase().as_str() {
            "a" => Some(Key::KeyA),
            "b" => Some(Key::KeyB),
            "c" => Some(Key::KeyC),
            "d" => Some(Key::KeyD),
            "e" => Some(Key::KeyE),
            "f" => Some(Key::KeyF),
            "g" => Some(Key::KeyG),
            "h" => Some(Key::KeyH),
            "i" => Some(Key::KeyI),
            "j" => Some(Key::KeyJ),
            "k" => Some(Key::KeyK),
            "l" => Some(Key::KeyL),
            "m" => Some(Key::KeyM),
            "n" => Some(Key::KeyN),
            "o" => Some(Key::KeyO),
            "p" => Some(Key::KeyP),
            "q" => Some(Key::KeyQ),
            "r" => Some(Key::KeyR),
            "s" => Some(Key::KeyS),
            "t" => Some(Key::KeyT),
            "u" => Some(Key::KeyU),
            "v" => Some(Key::KeyV),
            "w" => Some(Key::KeyW),
            "x" => Some(Key::KeyX),
            "y" => Some(Key::KeyY),
            "z" => Some(Key::KeyZ),
            _ => None,
        }
    }

    fn callback(&mut self, event: Event, key_map: HashMap<Key, Setting>) {
        match event.event_type {
            EventType::KeyPress(Key::Alt) => {
                self.alt_pressed = true;
            }
            EventType::KeyRelease(Key::Alt) => {
                self.alt_pressed = false;
            }
            EventType::KeyRelease(key) => {
                if let Some(_setting) = self
                    .settings
                    .iter()
                    .find(|setting| KeyState::string_to_key(&setting.letter) == Some(key))
                {
                    self.other_key_pressed = false;
                }
            }
            EventType::KeyPress(key) => {
                if self.alt_pressed && !self.other_key_pressed {
                    self.other_key_pressed = true;

                    // Instead of iterating each time a key is pressed, we should do a lookup of the key_vec
                    if let Some(setting) = key_map.get(&key) {
                        let desktop = desktop_dir().unwrap();
                        let sound_file_path = PathBuf::from(&desktop)
                            .join("Noise Platform Sounds")
                            .join(&setting.filename);

                        if let Some(file_path) = sound_file_path.to_str() {
                            sounds::play_sound(
                                file_path.to_string(),
                                setting.user_volume,
                                setting.listener_volume,
                            );
                        }
                    }
                }
            }
            _ => (),
        }
    }
}

fn get_settings() -> Result<(SettingsFile, PathBuf), CustomError> {
    let desktop = desktop_dir().ok_or(CustomError::Error(
        "Unable to find desktop directory".to_string(),
    ))?;

    let settings_file_path = PathBuf::from(&desktop)
        .join("Noise Platform Sounds")
        .join("settings.json");

    if !settings_file_path.exists() {
        fs::write(&settings_file_path, "")?;
    }

    let settings_content = file::read_string(&settings_file_path)?;
    let settings_file: SettingsFile = serde_json::from_str(&settings_content)?;

    Ok((settings_file, settings_file_path))
}

#[tauri::command(rename_all = "snake_case")]
pub fn load_settings() -> Result<Vec<Setting>, CustomError> {
    let (settings_file, _settings_file_path) = get_settings()?;

    let settings = settings_file.audio_settings;

    let mut key_state = KeyState::new();

    key_state.settings = settings.clone();

    let mut key_map = HashMap::new();
    for setting in settings.clone() {
        if let Some(key) = KeyState::string_to_key(&setting.letter) {
            key_map.insert(key, setting);
        }
    }

    std::thread::spawn(move || {
        match listen(move |event| key_state.callback(event, key_map.clone())) {
            Ok(listener) => listener,
            Err(e) => {
                eprintln!("Error: {:?}", e);
            }
        };
    });

    Ok(settings)
}

#[tauri::command(rename_all = "snake_case")]
pub fn save_setting(
    file_name: String,
    keybind: String,
    user_volume: f32,
    listener_volume: f32,
) -> Result<(), CustomError> {
    let (mut settings_file, settings_file_path) = get_settings()?;

    let settings = &mut settings_file.audio_settings;

    if let Some(existing_setting) = settings
        .iter_mut()
        .find(|setting: &&mut Setting| setting.filename == file_name)
    {
        existing_setting.letter = keybind.to_lowercase().to_owned();
        existing_setting.user_volume = user_volume;
        existing_setting.listener_volume = listener_volume;
    } else {
        settings.push(Setting {
            filename: file_name.to_owned(),
            letter: keybind.to_lowercase().to_owned(),
            user_volume,
            listener_volume,
        });
    }

    let settings_string = serde_json::to_string_pretty(&settings_file)?;
    fs::write(settings_file_path, settings_string)?;

    Ok(())
}

// Need to globally set the audio devices to be used in every play_sound function call.
// This function will be called from the settings page, and the selected devices will be saved to the settings file.
// The settings file will be read on app startup, and the selected devices will be set as the default devices if there's no overrides in the settings file
pub fn load_audio_devices() -> Result<(Vec<String>, Vec<String>), CustomError> {
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

pub fn save_audio_devices(input_device: String, output_device: String) -> Result<(), CustomError> {
    let desktop = desktop_dir().ok_or(CustomError::Error(
        "Unable to find desktop directory".to_string(),
    ))?;

    let settings_file_path = PathBuf::from(&desktop)
        .join("Noise Platform Sounds")
        .join("settings.json");

    if !settings_file_path.exists() {
        fs::write(&settings_file_path, "")?;
    }

    let settings_content = file::read_string(&settings_file_path)?;
    let mut settings_file: SettingsFile = serde_json::from_str(&settings_content)?;

    settings_file.input_device = input_device;
    settings_file.output_device = output_device;

    let settings_string = serde_json::to_string_pretty(&settings_file)?;
    fs::write(settings_file_path, settings_string)?;

    Ok(())
}
