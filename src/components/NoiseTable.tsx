import { invoke } from "@tauri-apps/api";
import { File } from "../types";
import { useState } from "react";

interface NoiseTable {
	fileData: File[];
	handleFileData: (fileData: File[]) => void;
}

const NoiseTable = ({ fileData, handleFileData }: NoiseTable) => {
	const defaultFile: File = {
		filename: "",
		path: "",
		duration: 0,
		keybind: "?",
		userVolume: 1,
		listenerVolume: 1,
	};

	const [newSetting, setNewSetting] = useState<File>(defaultFile);
	const [activeRow, setActiveRow] = useState<number | null>(null);

	async function playSound(file: File) {
		await invoke("play_sound", {
			file_path: file.path,
			user_volume: file.userVolume,
			listener_volume: file.listenerVolume,
		});
	}

	async function handleSaveSetting(selectedFile: File) {
		if (activeRow !== null) {
			await invoke("save_setting", {
				file_name: selectedFile?.filename,
				keybind: newSetting.keybind,
				user_volume: newSetting.userVolume,
				listener_volume: newSetting.listenerVolume,
			});

			const updatedFiles: File[] = fileData.map((file) => {
				if (file.filename == selectedFile!.filename) {
					return {
						...file,
						keybind: newSetting.keybind.toUpperCase(), // uppercase for display, lowercase for logic to prevent shift key weirdness
						userVolume: newSetting.userVolume,
						listenerVolume: newSetting.listenerVolume,
					};
				} else {
					return file;
				}
			});

			handleFileData(updatedFiles);
			setNewSetting(defaultFile);
		}

		setActiveRow(null);
	}

	return (
		<div className="p-4 border border-neutral-800 bg-neutral-900">
			<table className="table-auto">
				<thead>
					<tr>
						<th className="pr-2 text-left">Filename</th>
						<th className="px-2">Duration</th>
						<th className="px-2">Keybind</th>
						<th className="px-2">User</th>
						<th className="px-2">Listener</th>
						<th className="px-2"></th>
						<th className=""></th>
					</tr>
				</thead>
				<tbody>
					{fileData.map((file, i) => (
						<tr key={i}>
							<td className="text-left">
								{file.filename.length > 20
									? file.filename.slice(0, 20) + "..."
									: file.filename}
							</td>
							<td>{file.duration}s</td>
							<td className="h-10">
								<div className="flex justify-center">
									<label
										className="flex align-center justify-end"
										htmlFor="newSetting"
									>
										Alt +
									</label>
									<input
										className="bg-neutral-900 shadow-none border border-transparent hover:border-white transition-all duration-150 w-6 p-0 align-center text-center"
										type="text"
										id={`newKeybind-${i}`}
										maxLength={1}
										placeholder={file.keybind.toUpperCase() || "?"}
										onFocus={() => setActiveRow(i)}
										onChange={(e) => {
											setActiveRow(i);
											setNewSetting({
												...newSetting,
												keybind: e.target.value,
											});
										}}
									/>
								</div>
							</td>
							<td className="h-10">
								<div className="flex justify-center">
									<input
										className="bg-neutral-900 shadow-none border border-transparent hover:border-white transition-all duration-150 w-10 p-0 align-center text-center"
										type="number"
										id={`newUserVolume-${i}`}
										min={0}
										max={200}
										placeholder={file?.userVolume.toString() || "1"}
										onFocus={() => setActiveRow(i)}
										onChange={(e) => {
											setActiveRow(i);
											const userVolume = parseInt(e.target.value);
											setNewSetting({
												...newSetting,
												userVolume: userVolume,
											});
										}}
									/>
									<label
										className="flex align-center justify-end"
										htmlFor="newSetting"
									>
										%
									</label>
								</div>
							</td>
							<td>
								<div className="flex justify-center">
									<input
										className="ml-2 bg-neutral-900 shadow-none border border-transparent hover:border-white transition-all duration-150 w-10 p-0 align-center text-center"
										type="number"
										id={`newListenerVolume-${i}`}
										min={0}
										max={200}
										placeholder={file?.listenerVolume.toString() || "1"}
										onFocus={() => setActiveRow(i)}
										onChange={(e) => {
											setActiveRow(i);
											const listenerVolume = parseInt(e.target.value, 10);
											setNewSetting({
												...newSetting,
												listenerVolume: listenerVolume,
											});
										}}
									/>
									<label
										className="flex align-center justify-end"
										htmlFor="newSetting"
									>
										%
									</label>
								</div>
							</td>
							<td>
								<button
									className="px-3 py-1 text-sm bg-black border border-neutral-800 hover:border-white transition-all duration-150 hover:shadow-neutral-500 hover:shadow-sm"
									onClick={() => handleSaveSetting(file)}
								>
									Save
								</button>
							</td>
							<td>
								<button
									className="px-3 py-1 text-sm bg-black border border-neutral-800 hover:border-white transition-all duration-150 hover:shadow-neutral-500 hover:shadow-sm"
									onClick={() => playSound(file)}
								>
									Preview
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default NoiseTable;
