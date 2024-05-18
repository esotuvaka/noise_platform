// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod errors;
mod files;
mod settings;
mod sounds;

use std::sync::Mutex;
use std::{collections::HashMap, path::PathBuf};

use rdev::{listen, Event, EventType, Key};
use serde::{Deserialize, Serialize};
use tauri::api::path::desktop_dir;

use crate::settings::Setting;

use files::get_settings;

pub struct SettingsState {
    settings_state: Mutex<settings::SettingsFile>,
}

impl Default for SettingsState {
    fn default() -> Self {
        let settings_file  = get_settings().expect("Failed to load settings. Perhaps there is no settings.json file in the Noise Platform Sounds folder on the desktop?");
        let input_device = settings_file.input_device;
        let output_device = settings_file.output_device;
        let audio_settings = settings_file.audio_settings;

        Self {
            settings_state: Mutex::new(settings::SettingsFile {
                input_device,
                output_device,
                audio_settings,
            }),
        }
    }
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

                    if let Some(setting) = key_map.get(&key) {
                        let desktop = desktop_dir().unwrap();
                        let sound_file_path = PathBuf::from(&desktop)
                            .join("Noise Platform Sounds")
                            .join(&setting.filename);

                        if let Some(file_path) = sound_file_path.to_str() {
                            dbg!("Playing sound!");
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

fn main() {
    tauri::Builder::default()
        .manage(SettingsState::default())
        .setup(|_app| {
            let mut key_state = KeyState::new();
            key_state.settings = SettingsState::default()
                .settings_state
                .lock()
                .unwrap()
                .audio_settings
                .clone();

            let mut key_map = HashMap::new();
            for setting in key_state.settings.clone() {
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

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            files::open_sounds_folder,
            sounds::get_sound_duration,
            sounds::play_sound,
            settings::save_setting,
            settings::load_settings,
            settings::load_audio_devices,
            settings::save_audio_devices,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
