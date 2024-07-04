import { useEffect, useState } from "react";
import { readDir, exists, BaseDirectory } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";

import Navbar from "./components/Navbar";
import NoiseTable from "./components/NoiseTable";
import { File } from "./types";

interface Setting {
	filename: string;
	letter: string;
	userVolume: number;
	listenerVolume: number;
}

function App() {
	const [fileData, setFileData] = useState<File[]>([]);
	const [audioDevices, setAudioDevices] = useState<[string[], string[]]>([
		[""],
		[""],
	]);

	async function soundFolderExists() {
		console.info("Checking if sound folder exists");
		const soundFolderExists: boolean = await exists("Noise Platform Sounds", {
			dir: BaseDirectory.Desktop,
		});
		return soundFolderExists;
	}

	async function getSoundFiles() {
		console.info("Getting sound files");
		if (!(await soundFolderExists())) {
			console.log("ERROR: Sound folder does not exist!");
			return;
		}
		const entries = await readDir("Noise Platform Sounds", {
			dir: BaseDirectory.Desktop,
			recursive: true,
		});

		// Remove files that no longer exist
		setFileData((prev) =>
			prev.filter((file) =>
				entries.some((entry) => entry.name === file.filename)
			)
		);

		const audioSettings: Setting[] = await invoke("load_settings");

		for (const entry of entries) {
			const fileDupeIndex = fileData.findIndex(
				(file) => file.filename === entry.name
			);

			if (
				fileDupeIndex < 0 &&
				entry.name?.includes(".mp3" || ".wav" || ".vorbis" || ".flac")
			) {
				const entryDuration = await getSoundDuration(entry.path);

				const matchingSetting = audioSettings.find(
					(sett) => sett.filename === entry.name
				);

				const keybind = matchingSetting?.letter.toUpperCase();
				const userVolume = matchingSetting?.userVolume || 1;
				const listenerVolume = matchingSetting?.listenerVolume || 1;

				setFileData((prev) => [
					...prev,
					{
						filename: entry.name!,
						path: entry.path,
						duration: entryDuration,
						keybind: keybind || "?",
						userVolume: userVolume,
						listenerVolume: listenerVolume,
					},
				]);
			}
		}
	}

	async function loadSettings() {
		console.info("Loading settings");
		const audioSettings: Setting[] = await invoke("load_settings");

		const updatedFileData: File[] = fileData.map((file) => {
			const matchingSetting = audioSettings.find(
				(s) => s.filename === file.filename
			);

			if (matchingSetting) {
				return {
					...file,
					keybind: matchingSetting.letter.toUpperCase(),
					userVolume: matchingSetting.userVolume,
				};
			}
			return file;
		});

		setFileData(updatedFileData);
	}

	async function loadAudioDevices() {
		console.info("Loading audio devices");
		const audioDevices: [string[], string[]] = await invoke(
			"load_audio_devices"
		);

		setAudioDevices(audioDevices);
	}

	useEffect(() => {
		getSoundFiles();
		loadSettings();
		loadAudioDevices();
	}, []);

	async function getSoundDuration(filePath: string) {
		console.info("Getting sound duration");
		let soundDuration: number = await invoke("get_sound_duration", {
			file_path: filePath,
		});
		return soundDuration;
	}

	function handleFileData(fileData: File[]) {
		setFileData(fileData);
	}

	async function handleRefresh() {
		getSoundFiles();
	}

	return (
		<div className="m-0 flex h-lvh w-lvw flex-col justify-center text-center bg-gradient-to-b from-neutral-900 to-black text-white">
			<Navbar audioDevices={audioDevices} handleRefresh={handleRefresh} />

			{fileData.length === 0 ? (
				<div className="w-full h-full flex flex-col justify-center items-center">
					<h1 className="text-2xl">No sound files found</h1>
					<p>
						Click the folder icon to open the sounds folder and add some files
					</p>
				</div>
			) : (
				<section className="flex justify-center">
					<NoiseTable fileData={fileData} handleFileData={handleFileData} />
				</section>
			)}
		</div>
	);
}

export default App;
