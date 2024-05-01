# NOISE PLATFORM

## A soundboard written in Rust + TypeScript

Rather than purchasing a soundboard, this was created as a fun project to experiment with rust on the desktop. Its basic and not very idiomatic, but has been a blast to make and mess around with friends.

Feel free to contribute!

## Disclaimer

**I'm not responsible for any injury or hearing loss caused by this app!**
_There are volume settings for the sounds that you load, but user discretion is required to prevent playing sounds too loudly. For example, some extremely loud, bass-boosted sounds need to be played at 1% volume to be tolerable_

This is a small passion project. There will be bugs and platform / device dependencies that aren't accounted for.

## Setup

As of right now, my current setup for running this app is Windows 10 OS, with SteelSeries' SonarGG Software for managing audio devices.

**In theory**, just about any audio device management software like Virtual Audio Cable, SonarGG, Voicemeeter, etc. should be usable with this app.

## Stack

Backend

- `Tauri` as the desktop executable
- `cpal` crate for streaming audio to audio input devices (virtual audio cable / microphone)
- `rodio` crate for streaming audio to audio output device

Frontend

- `React` for rendering the UI
- `Typescript` for fuzzy type-matching to Rust equivalents
- `Tailwind CSS` for styling because its convenient

## Complete

- Button to open "Noises" folder
- Button to list available "noise" files
- Get file duration
- Map keybinds (and save them so they persist between app open/close)
- Button to preview listening to the sound
- ! Default volume for new sounds being added NEEDS to be 1%, so users can experiment and increase volume more safely
- Make existing keybinds visible in the frontend on initial app open
- Play the sound through the mic at same time as it plays in headphones
- Volume settings
- Keyboard listener thats active while the app is open, that plays sound when keybind pressed

## Ongoing

- ! Add setting for tracking user vs listener volume. Update structs / interfaces, frontend state, and backend object construction accordingly.
- ? Create util function to grab the desktop dir and settings.json file
- Check sounds folder after the prompt window closes to refresh all mp3s in the app

## Observations:

- Can either get the keybinds data in Rust or React
