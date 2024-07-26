use serde::Serialize;
use std::fmt::Display;
use thiserror::Error;

#[derive(Debug, Serialize, Error)]
pub struct SerializableDevicesError(String);
#[derive(Debug, Serialize, Error)]
pub struct SerializableDeviceNamesError(String);

impl Display for SerializableDevicesError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}
impl Display for SerializableDeviceNamesError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}
impl From<cpal::DevicesError> for SerializableDevicesError {
    fn from(error: cpal::DevicesError) -> Self {
        SerializableDevicesError(error.to_string())
    }
}
impl From<cpal::DeviceNameError> for SerializableDeviceNamesError {
    fn from(error: cpal::DeviceNameError) -> Self {
        SerializableDeviceNamesError(error.to_string())
    }
}

#[derive(Debug, Error, Serialize)]
pub enum AppError {
    #[error("File error: {0}")]
    Files(#[from] FilesError),
    #[error("Settings error: {0}")]
    Settings(#[from] SettingsError),
    #[error("Sounds error: {0}")]
    Sounds(#[from] SoundsError),
}

#[derive(Debug, Error, Serialize)]
pub enum SettingsError {
    #[error("Failed to find sounds folder")]
    LoadSoundsFolder,
    #[error("Failed to serialize settings state")]
    SerializeSettings,
    #[error("Failed to deserialize settings state")]
    DeserializeSettings,
    #[error("Failed to write settings file")]
    WriteSettings,
    #[error("Failed to load audio devices")]
    LoadAudioDevices(#[from] SerializableDevicesError),
    #[error("Failed to get audio device names")]
    GetDeviceNames(#[from] SerializableDeviceNamesError),
}

#[derive(Debug, Error, Serialize)]
pub enum SoundsError {
    #[error("Failed to load sound file")]
    LoadSoundFile,
    #[error("Failed to open sound file path")]
    OpenSoundFilePath,
}

#[derive(Debug, Error, Serialize)]
pub enum FilesError {
    #[error("Failed to create sounds folder")]
    CreateSoundsFolder,
    #[error("Failed to create settings file")]
    CreateSettingsFile,
    #[error("Failed to deserialize settings file")]
    DeserializeSettingsFile,
    #[error("Failed to read settings file")]
    ReadSettingsFile,
    #[error("Failed to get desktop directory")]
    DesktopDir,
}
