use rdev::{listen, Event, EventType, Key, Keyboard, KeyboardState};
use std::cell::RefCell;
use std::rc::Rc;
use std::sync::Arc;
use tauri::AppHandle;
use tauri::Manager;

use crate::files::get_sounds_folder;
use crate::sounds;
use crate::SettingsState;

#[derive(Debug, PartialEq)]
enum KeybindState {
    WaitingForFirstKey,
    FirstKeyPressed(Key),
    KeyCombinationPressed(Key, Key),
}

struct KeybindListener {
    state: KeybindState,
    keyboard: Keyboard,
    first_key: Key,
}

impl KeybindListener {
    fn new(first_key: Key) -> Self {
        KeybindListener {
            state: KeybindState::WaitingForFirstKey,
            keyboard: Keyboard::new().unwrap(),
            first_key,
        }
    }

    fn handle_event(&mut self, app_handle: Arc<AppHandle>, event: Event) {
        match event.event_type {
            EventType::KeyPress(key) => {
                match self.state {
                    KeybindState::WaitingForFirstKey if key == self.first_key => {
                        self.state = KeybindState::FirstKeyPressed(key);
                    }
                    KeybindState::FirstKeyPressed(_) => {
                        self.state = KeybindState::KeyCombinationPressed(self.first_key, key);

                        // Convert Key enum into a string so we can match against keys in our settings
                        let keyboard = &mut self.keyboard;
                        if let Some(second_key) = keyboard.add(&EventType::KeyPress(key)) {
                            dbg!(second_key.clone());

                            // Load the settings file from app state
                            let app_state = app_handle.state::<SettingsState>();

                            let mutex_settings = app_state.settings_state.lock().unwrap();
                            let settings = &mutex_settings.audio_settings;

                            match settings.iter().find(|setting| setting.letter == second_key) {
                                Some(setting) => {
                                    let sound_file_path = get_sounds_folder()
                                        .unwrap()
                                        .join(&setting.filename)
                                        .to_str()
                                        .unwrap()
                                        .to_string();

                                    sounds::make_some_noise(
                                        sound_file_path,
                                        setting.user_volume,
                                        setting.listener_volume,
                                        mutex_settings.input_device.clone(),
                                        mutex_settings.output_device.clone(),
                                    )
                                }
                                None => {
                                    dbg!("No sound found for key {:?}", second_key);
                                }
                            }
                        }

                        // reset state after our sound is played
                        self.state = KeybindState::WaitingForFirstKey;
                    }
                    _ => {}
                }
            }
            EventType::KeyRelease(key) if key == self.first_key => {
                self.state = KeybindState::WaitingForFirstKey
            }
            _ => {}
        }
    }
}

pub fn run_listener(app_handle: AppHandle) {
    // TODO: Make this configurable
    const FIRST_KEY: Key = Key::Alt;

    let listener = Rc::new(RefCell::new(KeybindListener::new(FIRST_KEY)));
    let app_handle = Arc::new(app_handle); // Wrap the app_handle in an Arc

    if let Err(error) = listen(move |event| {
        let mut listener = listener.borrow_mut();
        let app_handle = Arc::clone(&app_handle); // Clone the Arc for use in the closure
        listener.handle_event(app_handle, event); // Adjust the handle_event method to take an Arc<AppHandle>
    }) {
        dbg!("Error: {:?}", error);
    }
}
