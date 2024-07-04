// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use files::get_sounds_folder_path;
use std::sync::Mutex;

mod errors;
mod files;
mod keyboard_listener;
mod settings;
mod sounds;

#[derive(Debug)]
pub struct SettingsState {
    settings_state: Mutex<settings::SettingsFile>,
}

impl Default for SettingsState {
    fn default() -> Self {
        let should_create_sounds_folder = get_sounds_folder_path().is_err();
        if should_create_sounds_folder {
            files::create_sounds_folder().expect("Failed to create sounds folder");
            files::create_settings_file().expect("Failed to create settings file");
        }

        let settings_file = files::get_settings().expect("Unable to load settings file");

        let input_device = settings_file.input_device;
        let output_device = settings_file.output_device;

        // TODO: Convert to HashMap for faster lookups
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

fn main() {
    tauri::Builder::default()
        .manage(SettingsState::default())
        .setup(|app| {
            let app_handle = app.handle();

            std::thread::spawn(move || {
                keyboard_listener::run_listener(app_handle);
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
