use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use lofty::{AudioFile, Probe};
use ringbuf::HeapRb;
use rodio::{Decoder, OutputStream, Sink};
use std::{fs::File, io::BufReader};
use tauri::State;

use crate::errors::SoundsError;
use crate::{files::get_sounds_folder_path, SettingsState};

#[tauri::command(rename_all = "snake_case")]
pub async fn get_sound_duration(file_path: String) -> Result<u64, SoundsError> {
    let sound_file_path = get_sounds_folder_path()
        .map_err(|_| SoundsError::GetSoundsFolder)?
        .join(file_path);
    if !sound_file_path.is_file() {
        return Err(SoundsError::LoadSoundFile);
    }

    let tagged_file = Probe::open(&sound_file_path)
        .map_err(|_| SoundsError::OpenSoundFilePath)?
        .read()
        .map_err(|_| SoundsError::LoadSoundFile)?;

    Ok(tagged_file.properties().duration().as_secs())
}

pub fn make_some_noise(
    path_to_sound: String,
    user_volume: f32,
    listener_volume: f32,
    in_device: String,
    out_device: String,
) -> Result<(), SoundsError> {
    std::thread::spawn(move || {
        dbg!(path_to_sound.clone());

        // Open the audio file
        let file = File::open(&path_to_sound).map_err(|_| SoundsError::LoadSoundFile)?;
        let host = cpal::default_host();

        let input_device = host
            .input_devices()
            .unwrap()
            .find(|device| device.name().unwrap_or("".to_owned()).contains(&out_device))
            .expect("Failed to find audio input device");

        let output_device = host
            .output_devices()
            .unwrap()
            .find(|device| device.name().unwrap_or("".to_owned()).contains(&in_device))
            .expect("Failed to find audio output device");

        let config: cpal::StreamConfig = input_device.default_input_config().unwrap().into();
        let output_config: cpal::StreamConfig =
            output_device.default_output_config().unwrap().into();

        // Stream audio file to the mic
        let (_stream, stream_handle) = OutputStream::try_from_device(&output_device).unwrap();
        let sink = Sink::try_new(&stream_handle).unwrap();
        sink.set_volume(listener_volume / 1000.0);
        let reader = BufReader::new(file);
        sink.append(Decoder::new(reader).unwrap());

        // Stream audio to headset
        let (_stream, stream_handle) = OutputStream::try_default().unwrap();
        let sink = Sink::try_new(&stream_handle).unwrap();
        sink.set_volume(user_volume / 1000.0);
        let file = File::open(&path_to_sound).unwrap();
        let reader = BufReader::new(file);
        sink.append(Decoder::new(reader).unwrap());

        let latency_frames = (50.0 / 1_000.0) * config.sample_rate.0 as f32;
        let latency_samples = latency_frames as usize * config.channels as usize;

        // The buffer to share samples
        let ring = HeapRb::<f32>::new(latency_samples * 2);
        let (mut producer, mut consumer) = ring.split();

        for _ in 0..latency_samples {
            // The ring buffer has twice as much space as necessary to add latency here,
            // so this should never fail
            producer.push(0.0).unwrap();
        }

        // This controls audio stream to mic
        let output_data_fn = move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
            let mut input_fell_behind = false;
            for sample in data {
                *sample = match consumer.pop() {
                    Some(s) => s * (0.1 / 100.0), // This ratio is the amount of echo (100% == full echo)
                    None => {
                        input_fell_behind = true;
                        0.0
                    }
                };
            }
            if input_fell_behind {
                eprintln!("input stream fell behind: try increasing latency");
            }
        };
        let input_data_fn = move |data: &[f32], _: &cpal::InputCallbackInfo| {
            let mut output_fell_behind = false;
            for &sample in data {
                if producer.push(sample).is_err() {
                    output_fell_behind = true;
                }
            }
            if output_fell_behind {
                eprintln!("output stream fell behind: try increasing latency");
            }
        };

        // Initialize the audio input stream to capture the audio from the Virtual Audio Device output
        let config = input_device.default_input_config().unwrap().into();
        let input_stream = input_device
            .build_input_stream(
                &config,
                input_data_fn,
                |err| {
                    eprintln!("Error occurred in input stream: {}", err);
                },
                None,
            )
            .unwrap();

        // Start the audio input stream
        let output_stream = output_device
            .build_output_stream(
                &output_config,
                output_data_fn,
                |err| {
                    eprintln!("an error occurred on stream: {}", err);
                },
                None,
            )
            .unwrap();

        input_stream.play().unwrap();
        output_stream.play().unwrap();

        sink.sleep_until_end();

        Ok::<(), SoundsError>(())
    });

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub fn play_sound(
    file_path: String,
    user_volume: f32,
    listener_volume: f32,
    state: State<'_, SettingsState>,
) {
    let input_device = state.settings_state.lock().unwrap().input_device.clone();
    let output_device = state.settings_state.lock().unwrap().output_device.clone();

    let path_to_sound = file_path;

    // Callable via Tauri command from React on 'preview' button, vs direct invocation via keybind listener
    make_some_noise(
        path_to_sound,
        user_volume,
        listener_volume,
        input_device,
        output_device,
    )
    .expect("Failed to play sound")
}
