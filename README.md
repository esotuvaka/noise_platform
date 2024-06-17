# NOISE PLATFORM

Rather than purchasing a soundboard, this was created as a fun project to experiment with rust on the desktop. Its basic and not very idiomatic, but has been a blast to make and mess around with friends.

Feel free to contribute!

![alt text](screenshots/noise_platform_0.1.png)

## Setup

My current setup for running this app is Windows 10 OS, with SteelSeries' SonarGG Software for managing audio devices.

Be sure to disable or lower AI audio filtering and background noise filtering as they'll make sounds come through unclearly. For example, use 'Standard' noise suppression on Discord:

**In theory**, just about any audio device management software like Virtual Audio Cable, SonarGG, Voicemeeter, etc. should be usable with this app.

![alt text](screenshots/discord-noise-suppression.png)

## Stack

Backend

- `Tauri` as the desktop executable
- `cpal` crate for streaming audio to audio input devices (virtual audio cable / microphone)
- `rodio` crate for streaming audio to audio output device

Frontend

- `React` for rendering the UI
- `Typescript` for rough type-matching to Rust equivalents
- `Tailwind CSS` for styling because its convenient

## Observations

!!! Observed: The input and output devices can be derived from the settings file. Use this in the state to reduce redundant calls to backend

## Complete

- Button to open "Noises" folder
- Button to list available "noise" files
- Get file duration
- Map keybinds (and save them so they persist between app open/close)
- Button to preview listening to the sound
- Make existing keybinds visible in the frontend on initial app open
- Play the sound through the mic at same time as it plays in headphones
- Volume settings
- Keyboard listener thats active while the app is open, that plays sound when keybind pressed
- ! Add setting for tracking user vs listener volume. Update structs / interfaces, frontend state, and backend object construction accordingly.
- ! Refactor `string_to_key` to create a hashmap of the existing keybinds based on the keybinds in the settings. This will prevent unnecessary processing from occurring on key press
- ! Ability to manually configure audio input and output devices
- ? Create util function to grab the desktop dir and settings.json file

## Ongoing

- Icons for the desktop app
- Downloadable desktop app
- ! Tests
- Categorization of sounds into different boards. We can use a tagging system so a sound can appear in multiple boards
- Input validation for keybinds to ensure we're able to match against them via Key<letter, num, etc>
- Need to refactor for better variable naming
- ! Large refactor to use tauri `State` to keep track of the settings file. This will include the input/output audio devices, as well as sound files, keybinds, volumes, etc
- Pass errors returned in the backend to the frontend and display them as little popups in the corner
- ! BUG: Sounds can be attempted to be played via keybind even if not available in the noise platform sounds folder
- ? Echo setting
- ? Distortion setting
- Add the ListenError (rdev crate) to our CustomError type
- ? Customizable color theme settings
- ? Compilation to Linux Distros via WSL
