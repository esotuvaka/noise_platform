import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import Navbar from "./components/Navbar";
import NoiseTable from "./components/NoiseTable";
import { SettingsFile } from "./types";

function App() {
	const [settingsFile, setSettingsFile] = useState<SettingsFile | null>(null);
	const [allAudioDevices, setAllAudioDevices] = useState<[string[], string[]]>([
		[],
		[],
	]);

	async function getSettingsFile() {
		console.info("Getting settings file");
		const settingsFile: SettingsFile = await invoke("get_settings_file");
		console.info("Settings file", settingsFile);
		setSettingsFile(settingsFile);
	}

	useEffect(() => {
		async function loadAudioDevices() {
			const allAudioDevices: [string[], string[]] = await invoke(
				"load_audio_devices"
			);
			setAllAudioDevices(allAudioDevices);
		}

		getSettingsFile();
		loadAudioDevices();
	}, []);

	return (
		<div className="m-0 flex h-lvh w-lvw flex-col justify-center text-center bg-gradient-to-b from-neutral-800 to-black text-white">
			<Navbar
				audioDevices={allAudioDevices}
				handleRefresh={() => getSettingsFile()}
			/>

			{settingsFile?.noiseSettings.length === 0 ? (
				<div className="w-full h-full flex flex-col justify-center items-center">
					<h1 className="text-2xl">No sound files found</h1>
					<p>
						Click the folder icon to open the sounds folder and add some files
					</p>
				</div>
			) : (
				<section className="flex justify-center">
					<NoiseTable noiseSettings={settingsFile?.noiseSettings} />
				</section>
			)}
		</div>
	);
}

export default App;
