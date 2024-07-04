import { invoke } from "@tauri-apps/api";
import { File } from "../types";
import { useState } from "react";
import useDebounce from "../hooks/useDebounce";

interface NoiseTable {
	fileData: File[];
	handleFileData: (fileData: File[]) => void;
}

const NoiseTable = ({ fileData, handleFileData }: NoiseTable) => {
	const [newSetting, setNewSetting] = useState<File>({
		filename: "",
		path: "",
		duration: 0,
		keybind: "?",
		userVolume: 1,
		listenerVolume: 1,
	});

	async function playSound(file: File) {
		await invoke("play_sound", {
			file_path: file.path,
			user_volume: file.userVolume,
			listener_volume: file.listenerVolume,
		});
	}

	async function handleSaveSetting(selectedFile: File) {
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
		setNewSetting({
			filename: "",
			path: "",
			duration: 0,
			keybind: "?",
			userVolume: 1,
			listenerVolume: 1,
		});
	}

	return (
		<div className="p-4 border border-neutral-300 bg-neutral-900">
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
										className="ml-2 bg-neutral-900 shadow-none border border-transparent hover:border-white transition-all duration-150 w-6 p-0 align-center text-center"
										type="text"
										id="newKeybind"
										maxLength={1}
										placeholder={file.keybind.toUpperCase() || "?"}
										onChange={(e) =>
											setNewSetting({
												...newSetting,
												keybind: e.target.value,
											})
										}
									/>
								</div>
							</td>
							<td className="h-10">
								<div className="flex justify-center">
									<input
										className="ml-2 bg-neutral-900 shadow-none border border-transparent hover:border-white transition-all duration-150 w-10 p-0 align-center text-center"
										type="number"
										id="newUserVolume"
										min={0}
										max={200}
										placeholder={file?.userVolume.toString() || "1"}
										onChange={(e) => {
											const userVolume = parseInt(e.target.value);
											if (
												!isNaN(userVolume) &&
												userVolume >= 0 &&
												userVolume <= 200
											) {
												setNewSetting({
													...newSetting,
													userVolume: userVolume,
												});
											} else {
												// Reset the input field if the value is outside the valid range
												e.target.value =
													newSetting.userVolume?.toString() || "";
											}
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
										id="newListenerVolume"
										min={0}
										max={200}
										placeholder={file?.listenerVolume.toString() || "1"}
										onChange={(e) => {
											const listenerVolume = parseInt(e.target.value, 10);
											if (
												!isNaN(listenerVolume) &&
												listenerVolume >= 0 &&
												listenerVolume <= 200
											) {
												setNewSetting({
													...newSetting,
													listenerVolume: listenerVolume,
												});
											} else {
												// Reset the input field if the value is outside the valid range
												e.target.value =
													newSetting.listenerVolume?.toString() || "";
											}
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
