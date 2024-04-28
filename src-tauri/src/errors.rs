use lofty::LoftyError;
use std::{fmt, io};
use tauri::Error as TauriError;
use tauri::InvokeError;

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
impl From<LoftyError> for CustomError {
    fn from(error: LoftyError) -> Self {
        CustomError::Error(error.to_string())
    }
}
