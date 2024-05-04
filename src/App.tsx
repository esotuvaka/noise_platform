import { useEffect, useState } from "react";
import {
	readDir,
	createDir,
	exists,
	BaseDirectory,
	writeFile,
} from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";

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
	const [newSetting, setNewSetting] = useState<Setting>({
		filename: "",
		letter: "?",
		userVolume: 1,
		listenerVolume: 1,
	});

	async function getSoundFiles() {
		if (!(await soundFolderExists())) {
			console.log("ERROR: Sound folder does not exist!");
			return;
		}
		const entries = await readDir("Noise Platform Sounds", {
			dir: BaseDirectory.Desktop,
			recursive: true,
		});
		console.log("ENTRIES");
		console.log(entries);

		// Remove files that no longer exist
		setFileData((prev) =>
			prev.filter((file) => entries.some((entry) => entry.name === file.name))
		);

		for (const entry of entries) {
			const fileDupeIndex = fileData.findIndex(
				(file) => file.name === entry.name
			);

			if (
				fileDupeIndex < 0 &&
				entry.name?.includes(".mp3" || ".wav" || ".vorbis" || ".flac")
			) {
				const entryDuration = await getSoundDuration(entry.path);
				const settings: Setting[] = await invoke("load_settings");

				const matchingSetting = settings.find(
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
		const settings: Setting[] = await invoke("load_settings");

		const updatedFileData: File[] = fileData.map((file) => {
			const matchingSetting = settings.find(
				(sett) => sett.filename === file.name
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

	useEffect(() => {
		getSoundFiles();
		loadSettings();
	}, []);

	async function playSound(file: File) {
		await invoke("play_sound", {
			file_path: file.path,
			user_volume: file.userVolume,
			listener_volume: file.listenerVolume,
		});
	}

	useEffect(() => {
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
		let soundDuration: number = await invoke("get_sound_duration", {
			file_path: filePath,
		});
		return soundDuration;
	}

	async function soundFolderExists() {
		const soundFolderExists: boolean = await exists("Noise Platform Sounds", {
			dir: BaseDirectory.Desktop,
		});
		return soundFolderExists;
	}

	async function openSoundsFolder() {
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

	return (
		<div className="container">
			<div className="button-container">
				<div className="button-container-inner">
					<form
						className="row"
						onSubmit={(e) => {
							e.preventDefault();
							openSoundsFolder();
						}}
					>
						<button type="submit">Open Sounds Folder</button>
					</form>
					<form
						className="row"
						onSubmit={(e) => {
							e.preventDefault();
							getSoundFiles();
						}}
					>
						<button type="submit">Refresh</button>
					</form>
				</div>
			</div>

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
