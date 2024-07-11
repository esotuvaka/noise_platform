import { invoke } from "@tauri-apps/api";
import { File } from "../types";
import { useState } from "react";

interface NoiseTable {
	fileData: File[];
	handleFileData: (fileData: File[]) => void;
}

const NoiseTable = ({ fileData, handleFileData }: NoiseTable) => {
	const [settings, setSettings] = useState<File[]>(fileData);

	async function playSound(file: File) {
		await invoke("play_sound", {
			file_path: file.path,
			user_volume: file.userVolume,
			listener_volume: file.listenerVolume,
		});
	}

	async function handleSaveSetting(selectedFile: File) {
		const matchingRow = settings.find((setting) => {
			console.info("Matching setting", setting.filename, selectedFile.filename);
			return setting.filename == selectedFile.filename;
		});

		if (matchingRow) {
			console.info(
				"Saving setting",
				matchingRow.filename,
				matchingRow.keybind.toUpperCase(),
				matchingRow.userVolume,
				matchingRow.listenerVolume
			);
			await invoke("save_setting", {
				file_name: matchingRow.filename,
				keybind: matchingRow.keybind.toUpperCase(),
				user_volume: matchingRow.userVolume,
				listener_volume: matchingRow.listenerVolume,
			});

			const updatedFiles: File[] = fileData.map((file) => {
				if (file.filename == selectedFile!.filename) {
					return {
						...file,
						keybind: matchingRow.keybind.toUpperCase(), // uppercase for display, lowercase for logic to prevent shift key weirdness
						userVolume: matchingRow.userVolume,
						listenerVolume: matchingRow.listenerVolume,
					};
				} else {
					return file;
				}
			});

			handleFileData(updatedFiles);
		}
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
										style={{ textTransform: "uppercase" }}
										onChange={(e) => {
											const nextSettings = settings.map((setting) => {
												if (setting.filename === file.filename) {
													return {
														...setting,
														keybind: e.target.value.toUpperCase(),
													};
												} else {
													return setting;
												}
											});
											setSettings(nextSettings);
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
										onChange={(e) => {
											const userVolume = parseInt(e.target.value);
											const nextSettings = settings.map((setting) => {
												if (setting.filename === file.filename) {
													return {
														...setting,
														userVolume: userVolume,
													};
												} else {
													return setting;
												}
											});
											setSettings(nextSettings);
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
										onChange={(e) => {
											const listenerVolume = parseInt(e.target.value, 10);
											const nextSettings = settings.map((setting) => {
												if (setting.filename === file.filename) {
													return {
														...setting,
														listenerVolume: listenerVolume,
													};
												} else {
													return setting;
												}
											});
											setSettings(nextSettings);
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
									onClick={async () => await handleSaveSetting(file)}
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
