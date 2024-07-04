import { useState } from "react";
import { File } from "../types";
import { invoke } from "@tauri-apps/api";

interface NoiseSettingsModal {
	selectedFile: File | undefined;
	fileData: File[];
	handleShowModal: (show: boolean) => void;
	handleFileData: (fileData: File[]) => void;
	handleSelectedFile: (file: File | undefined) => void;
}

const NoiseSettingsModal = ({
	selectedFile,
	fileData,
	handleShowModal,
	handleFileData,
	handleSelectedFile,
}: NoiseSettingsModal) => {
	const [newSetting, setNewSetting] = useState<File>({
		filename: "",
		path: "",
		duration: 0,
		keybind: "?",
		userVolume: 1,
		listenerVolume: 1,
	});

	async function handleSaveSetting() {
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
		handleShowModal(false);
		handleSelectedFile(undefined);
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
		<div className="z-10 fixed inset-0 w-full h-full bg-black/50 flex justify-center items-center">
			<div className="flex flex-col bg-neutral-900 p-4">
				<div className="flex justify-end">
					<span
						className="text-neutral-300 float-right text-lg font-bold hover:cursor-pointer flex items-end"
						onClick={() => handleShowModal(false)}
					>
						&times;
					</span>
				</div>
				<h2>Edit Setting for "{selectedFile ? selectedFile.filename : "?"}"</h2>
				<div className="flex mb-4">
					<label
						className="flex align-center justify-end mt-2 mr-2"
						htmlFor="newSetting"
					>
						Alt +
					</label>
					<input
						className="w-4 align-center text-center"
						type="text"
						id="newSetting"
						placeholder={selectedFile?.keybind || "?"}
						onChange={(e) =>
							setNewSetting({
								...newSetting,
								keybind: e.target.value,
							})
						}
					/>
				</div>
				<div className="flex mb-4">
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
	);
};

export default NoiseSettingsModal;
