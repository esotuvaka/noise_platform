import { useEffect, useState } from "react";
import {
	readDir,
	createDir,
	exists,
	BaseDirectory,
	writeFile,
} from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import { IoRefresh } from "react-icons/io5";
import { FaRegFolderOpen } from "react-icons/fa";
import { AiOutlineAudio } from "react-icons/ai";
import { FiHeadphones } from "react-icons/fi";

import DevicesModal from "./components/DevicesModal";

interface File {
	name: string;
	path: string;
	duration: number;
	keybind: string;
	userVolume: number;
	listenerVolume: number;
}

interface Setting {
	filename: string;
	letter: string;
	userVolume: number;
	listenerVolume: number;
}

function App() {
	const [fileData, setFileData] = useState<File[]>([]);
	const [showModal, setShowModal] = useState<boolean>(false);
	const [selectedFile, setSelectedFile] = useState<File>();
	const [showOutputDevices, setShowOutputDevices] = useState<boolean>(false);
	const [showInputDevices, setShowInputDevices] = useState<boolean>(false);
	const [activeInputDevice, setActiveInputDevice] = useState<string>("");
	const [activeOutputDevice, setActiveOutputDevice] = useState<string>("");
	const [audioDevices, setAudioDevices] = useState<[string[], string[]]>([
		[""],
		[""],
	]);
	const [newSetting, setNewSetting] = useState<Setting>({
		filename: "",
		letter: "?",
		userVolume: 1,
		listenerVolume: 1,
	});

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
			prev.filter((file) => entries.some((entry) => entry.name === file.name))
		);

		const audioSettings: Setting[] = await invoke("load_settings");

		for (const entry of entries) {
			const fileDupeIndex = fileData.findIndex(
				(file) => file.name === entry.name
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
						name: entry.name!,
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
				(s) => s.filename === file.name
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

	async function playSound(file: File) {
		console.info("Playing sound");
		await invoke("play_sound", {
			file_path: file.path,
			user_volume: file.userVolume,
			listener_volume: file.listenerVolume,
		});
	}

	useEffect(() => {
		console.info("Selected file changed");
		if (selectedFile) {
			setNewSetting({
				filename: selectedFile.name,
				letter: selectedFile.keybind,
				userVolume: selectedFile.userVolume,
				listenerVolume: selectedFile.listenerVolume,
			});
		}
	}, [selectedFile]);

	async function getSoundDuration(filePath: string) {
		console.info("Getting sound duration");
		let soundDuration: number = await invoke("get_sound_duration", {
			file_path: filePath,
		});
		return soundDuration;
	}

	async function soundFolderExists() {
		console.info("Checking if sound folder exists");
		const soundFolderExists: boolean = await exists("Noise Platform Sounds", {
			dir: BaseDirectory.Desktop,
		});
		return soundFolderExists;
	}

	async function openSoundsFolder() {
		console.info("Opening sounds folder");
		try {
			if (await soundFolderExists()) {
				await invoke("open_sounds_folder");
			} else {
				await createDir("Noise Platform Sounds", {
					dir: BaseDirectory.Desktop,
					recursive: true,
				});
				await invoke("open_sounds_folder");
				await writeFile(
					{
						contents: "[]",
						path: `./Noise Platform Sounds/settings.json`,
					},
					{
						dir: BaseDirectory.Desktop,
					}
				);
			}
		} catch (e) {
			console.log(e);
		}
	}

	function handleEditClick(file: File) {
		setSelectedFile(file);
		setShowModal(true);
	}

	async function handleSaveSetting() {
		console.info("Saving setting");
		await invoke("save_setting", {
			file_name: selectedFile?.name,
			keybind: newSetting.letter,
			user_volume: newSetting.userVolume,
			listener_volume: newSetting.listenerVolume,
		});

		const updatedFiles: File[] = fileData.map((file) => {
			if (file.name == selectedFile!.name) {
				return {
					...file,
					keybind: newSetting.letter.toUpperCase(), // uppercase for display, lowercase for logic to prevent shift key weirdness
					userVolume: newSetting.userVolume,
					listenerVolume: newSetting.listenerVolume,
				};
			} else {
				return file;
			}
		});

		setFileData(updatedFiles);
		setShowModal(false);
		setSelectedFile(undefined);
		setNewSetting({
			filename: "",
			letter: "",
			userVolume: 1,
			listenerVolume: 1,
		});
	}

	async function saveAudioDevices(inputDevice: string, outputDevice: string) {
		console.info("Saving audio devices");
		const audioDevices = await invoke("save_audio_devices", {
			input_device: inputDevice,
			output_device: outputDevice,
		});
		console.log(audioDevices);
	}

	return (
		<div className="container">
			<nav className="navbar">
				<div className="navbar-inner">
					<DevicesModal
						deviceType="input"
						devices={audioDevices[0]}
						show={showInputDevices}
						onDeviceChange={(device: string) => {
							setActiveInputDevice(device);
							saveAudioDevices(device, activeOutputDevice);
						}}
					/>
					<div className="navbar-item">
						<span
							onClick={() => {
								setShowInputDevices(!showInputDevices);
							}}
						>
							<AiOutlineAudio />
						</span>
					</div>
					<DevicesModal
						deviceType="output"
						devices={audioDevices[1]}
						show={showOutputDevices}
						onDeviceChange={(device: string) => {
							setActiveOutputDevice(device);
							saveAudioDevices(activeInputDevice, device);
						}}
					/>
					<div className="navbar-item">
						<span
							onClick={() => {
								setShowOutputDevices(!showOutputDevices);
							}}
						>
							<FiHeadphones />
						</span>
					</div>
					<span />
					{/* Included just so we have equal spacing */}
					<div className="navbar-item">
						<span
							onClick={(e) => {
								e.preventDefault();
								openSoundsFolder();
							}}
						>
							<FaRegFolderOpen />
						</span>
					</div>
					<span />
					{/* Included just so we have equal spacing */}
					<div className="navbar-item">
						<span
							onClick={(e) => {
								e.preventDefault();
								getSoundFiles();
							}}
						>
							<IoRefresh />
						</span>
					</div>
				</div>
			</nav>

			<div className="table-container">
				<table className="sound-table">
					<thead>
						<tr>
							<th className="table-header">Filename</th>
							<th className="table-header">Duration</th>
							<th className="table-header">Keybind</th>
							<th className="table-header">User</th>
							<th className="table-header">Listener</th>
							<th className="th-button">Edit</th>
							<th className="th-button">Preview</th>
						</tr>
					</thead>
					<tbody>
						{fileData.map((file, i) => (
							<tr key={i}>
								<td className="td">
									{file.name.length > 20
										? file.name.slice(0, 20) + "..."
										: file.name}
								</td>
								<td className="td">{file.duration}s</td>
								<td className="td">Alt + {file.keybind}</td>
								<td className="td">{file.userVolume}%</td>
								<td className="td">{file.listenerVolume}%</td>
								<td>
									<button onClick={() => handleEditClick(file)}>Edit</button>
								</td>
								<td>
									<button onClick={() => playSound(file)}>Preview</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{showModal && (
					<div className={`modal ${showModal ? "active" : ""}`}>
						<div className="modal-content">
							<div className="modal-inner">
								<div className="modal-close">
									<span className="close" onClick={() => setShowModal(false)}>
										&times;
									</span>
								</div>
								<h2>
									Edit Setting for "{selectedFile ? selectedFile.name : "?"}"
								</h2>
								<div className="modal-setting">
									<label className="modal-prompt" htmlFor="newSetting">
										Alt +
									</label>
									<input
										className="modal-input-keybind"
										type="text"
										id="newSetting"
										placeholder={selectedFile?.keybind || "?"}
										onChange={(e) =>
											setNewSetting({
												...newSetting,
												letter: e.target.value,
											})
										}
									/>
								</div>
								<div className="modal-setting">
									<label className="modal-prompt" htmlFor="newUserVolume">
										User Volume:
									</label>
									<input
										className="modal-input-volume"
										type="number"
										id="newUserVolume"
										placeholder={selectedFile?.userVolume.toString() || "1"}
										onChange={(e) => {
											const userVolume = parseInt(e.target.value);
											if (userVolume >= 0 && userVolume <= 100) {
												setNewSetting({
													...newSetting,
													userVolume: userVolume,
												});
											}
										}}
									/>
								</div>
								<div className="modal-setting">
									<label className="modal-prompt" htmlFor="newListenerVolume">
										Listener Volume:
									</label>
									<input
										className="modal-input-volume"
										type="number"
										id="newListenerVolume"
										placeholder={selectedFile?.listenerVolume.toString() || "1"}
										onChange={(e) => {
											const listenerVolume = parseInt(e.target.value);
											if (listenerVolume >= 0 && listenerVolume <= 100) {
												setNewSetting({
													...newSetting,
													listenerVolume: listenerVolume,
												});
											}
										}}
									/>
								</div>
								<button onClick={handleSaveSetting}>Save</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
