use cpal::traits::HostTrait;
use rodio::DeviceTrait;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::api::{dialog::FileDialogBuilder, file, path::desktop_dir};

use crate::errors::FilesError;
use crate::settings::SettingsFile;

#[tauri::command]
pub async fn open_sounds_folder() -> Result<(), FilesError> {
    FileDialogBuilder::new()
        .set_directory(get_sounds_folder_path()?)
        .set_title("Add .mp3, .wav, .vorbis, or .flac sound clips here!")
        .pick_file(|_file_path| {});

    Ok(())
}

pub fn get_sound_files(sound_folder: std::path::PathBuf) -> Vec<String> {
    let sound_files = fs::read_dir(sound_folder)
        .unwrap()
        .filter_map(|entry| {
            let entry = entry.unwrap();
            let path = entry.path();
            if let Some(extension) = path.extension() {
                if extension == "wav"
                    || extension == "mp3"
                    || extension == "flac"
                    || extension == "vorbis"
                {
                    Some(entry.file_name().into_string().unwrap())
                } else {
                    None
                }
            } else {
                None
            }
        })
        .collect();

    sound_files
}

pub fn get_sounds_folder_path() -> Result<PathBuf, FilesError> {
    if let Some(desktop) = desktop_dir() {
        let sounds_folder_path: PathBuf = Path::new(&desktop).join("Noise Platform Sounds");
        if !sounds_folder_path.is_dir() {
            std::fs::create_dir(&sounds_folder_path).map_err(|_| FilesError::CreateSoundsFolder)?;
        }

        Ok(sounds_folder_path)
    } else {
        Err(FilesError::DesktopDir)
    }
}

pub fn get_settings() -> Result<SettingsFile, FilesError> {
    println!("Getting settings file");

    let settings_file_path = get_sounds_folder_path()?.join("settings.json");
    if !settings_file_path.exists() {
        fs::write(&settings_file_path, "").map_err(|_| FilesError::CreateSettingsFile)?;
    }

    let settings_content =
        file::read_string(&settings_file_path).map_err(|_| FilesError::ReadSettingsFile)?;
    let settings_file: SettingsFile =
        serde_json::from_str(&settings_content).map_err(|_| FilesError::DeserializeSettingsFile)?;

    Ok(settings_file)
}

pub fn create_sounds_folder() -> Result<(), FilesError> {
    let desktop = desktop_dir().ok_or(FilesError::DesktopDir)?;
    let sounds_folder_path = Path::new(&desktop).join("Noise Platform Sounds");
    if !sounds_folder_path.is_dir() {
        let _ =
            std::fs::create_dir(&sounds_folder_path).map_err(|_| FilesError::CreateSoundsFolder);
    }

    Ok(())
}

pub fn create_settings_file() -> Result<(), FilesError> {
    let settings_file_path = get_sounds_folder_path()
        .expect("Failed to get sounds folder path")
        .join("settings.json");

    let host = cpal::default_host();
    let default_input_device = host
        .default_input_device()
        .expect("Failed to get default input device")
        .name()
        .expect("Failed to get default input device name");
    let default_output_device = host
        .default_output_device()
        .expect("Failed to get default output device")
        .name()
        .expect("Failed to get default output device name");

    let default_settings = SettingsFile {
        input_device: default_input_device,
        output_device: default_output_device,
        noise_settings: Vec::new(),
    };

    let settings_string =
        serde_json::to_string_pretty(&default_settings).expect("Unable to convert to JSON string");
    fs::write(settings_file_path, settings_string).expect("Unable to write settings.json file");

    Ok(())
}
