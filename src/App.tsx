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
	volume: number;
}

interface Setting {
	filename: string;
	letter: string;
	volume: number;
}

function App() {
	const [fileData, setFileData] = useState<File[]>([]);
	const [showModal, setShowModal] = useState<boolean>(false);
	const [selectedFile, setSelectedFile] = useState<File>();
	const [newSetting, setNewSetting] = useState<Setting>({
		filename: "",
		letter: "",
		volume: 100,
	});

	useEffect(() => {
		getSoundFiles();
		loadSettings();
	}, []);

	useEffect(() => {
		setTimeout(() => {}, 100);
		const callback = (event: KeyboardEvent) => {
			if (
				event.altKey &&
				fileData.some(
					(file) => event.key.toLowerCase() === file.keybind.toLowerCase()
				)
			) {
				console.log("ALT + KEY PRESSED!");
				const file = fileData.find(
					(file) => event.key.toLowerCase() === file.keybind.toLowerCase()
				);
				if (file) {
					console.log("PLAYING SOUND FILE");
					playSound(file);
				}
			}
		};
		window.addEventListener("keydown", callback);

		return () => {
			window.removeEventListener("keydown", callback);
		};
	}, [fileData]);

	async function getSoundDuration(filePath: string) {
		let soundDuration: number = await invoke("get_sound_duration", {
			file_path: filePath,
		});
		return soundDuration;
	}

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

				setFileData((prev) => [
					...prev,
					{
						name: entry.name!,
						path: entry.path,
						duration: entryDuration,
						keybind: keybind || "?",
						volume: 100,
					},
				]);
			}
		}
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

	async function loadSettings() {
		const settings: Setting[] = await invoke("load_settings");

		const updatedFileData: File[] = fileData.map((file) => {
			const matchingSetting = settings.find(
				(sett) => sett.filename === file.name
			);

			if (matchingSetting) {
				console.log("MATCH!", matchingSetting, file.name);
				return {
					...file,
					keybind: matchingSetting.letter.toUpperCase(),
				};
			}
			return file;
		});

		setFileData(updatedFileData);
	}

	async function handleSaveSetting() {
		await invoke("save_setting", {
			file_name: selectedFile?.name,
			keybind: newSetting.letter,
			volume: newSetting.volume,
		});

		const updatedFiles: File[] = fileData.map((file) => {
			if (file.name == selectedFile!.name) {
				return {
					...file,
					keybind: newSetting.letter.toUpperCase(), // uppercase for display, lowercase for logic to prevent shift key weirdness
					volume: newSetting.volume,
				};
			} else {
				return file;
			}
		});

		setFileData(updatedFiles);
		setShowModal(false);
		setSelectedFile(undefined);
		setNewSetting({ filename: "", letter: "", volume: 100 });
	}

	async function playSound(file: File) {
		await invoke("play_sound", {
			file_path: file.path,
			volume: file.volume,
		});
	}

	function refreshFilesState() {
		getSoundFiles();
		console.log("FILEDATA STATE");
		console.log(fileData);
	}

	return (
		<div className="container">
			<h1>Welcome to Noise Platform!</h1>

			<div className="button-container">
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
						refreshFilesState();
					}}
				>
					<button type="submit">Refresh</button>
				</form>
			</div>

			<div className="table-container">
				<table className="sound-table">
					<thead>
						<tr>
							<th>Filename</th>
							<th>Duration</th>
							<th>Setting</th>
							<th>Edit</th>
							<th>Preview</th>
							<th>Volume</th>
						</tr>
					</thead>
					<tbody>
						{fileData.map((file, idx) => (
							<tr key={idx}>
								<td className="table-filename">{file.name}</td>
								<td>{file.duration}s</td>
								<td>Alt + {file.keybind}</td>
								<td>
									<button onClick={() => handleEditClick(file)}>Edit</button>
								</td>
								<td>
									<button onClick={() => playSound(file)}>Preview</button>
								</td>
								<td>{file.volume}%</td>
							</tr>
						))}
					</tbody>
				</table>

				{showModal && (
					<div className={`modal ${showModal ? "active" : ""}`}>
						<div className="modal-content">
							<span className="close" onClick={() => setShowModal(false)}>
								&times;
							</span>
							<h2>
								Edit Setting for "{selectedFile ? selectedFile.name : "?"}"
							</h2>
							<label className="modal-prompt" htmlFor="newSetting">
								Alt +
							</label>
							<input
								className="modal-input"
								type="text"
								id="newSetting"
								placeholder={newSetting.letter}
								value={newSetting.letter}
								onChange={(e) =>
									setNewSetting({
										filename: selectedFile!.name,
										letter: e.target.value,
										volume: newSetting.volume,
									})
								}
							/>
							<label className="modal-prompt" htmlFor="newVolume">
								Volume:
							</label>
							<input
								className="modal-input-volume"
								type="number"
								id="newVolume"
								placeholder={newSetting.volume.toString()}
								value={newSetting.volume}
								onChange={(e) => {
									const volume = parseInt(e.target.value);
									if (volume >= 0 && volume <= 100) {
										setNewSetting({
											filename: selectedFile!.name,
											letter: newSetting.letter,
											volume: volume,
										});
									}
								}}
							/>
							<button onClick={handleSaveSetting}>Save</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default App;
