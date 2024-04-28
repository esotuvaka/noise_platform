// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod errors;
mod files;
mod settings;
mod sounds;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            files::open_sounds_folder,
            sounds::get_sound_duration,
            sounds::play_sound,
            settings::save_setting,
            settings::load_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
