import { invoke } from "@tauri-apps/api";
import { Setting } from "../types";
import { useEffect, useState } from "react";

interface NoiseTable {
	noiseSettings: Setting[] | undefined;
}

const NoiseTable = ({ noiseSettings }: NoiseTable) => {
	console.info("Noise settings", noiseSettings);

	const [settings, setSettings] = useState<Setting[] | undefined>(undefined);
	const [durations, setDurations] = useState<number[]>([]);

	async function playSound(setting: Setting) {
		await invoke("play_sound", {
			filename: setting.filename,
			user_volume: setting.userVolume,
			listener_volume: setting.listenerVolume,
		});
	}

	async function handleSaveSetting(selectedSetting: Setting) {
		const matchingRow = settings?.find((setting) => {
			return setting.filename == selectedSetting.filename;
		});

		if (matchingRow) {
			console.info(
				"Saving setting",
				matchingRow.filename,
				matchingRow.keybind?.toUpperCase(),
				matchingRow.userVolume,
				matchingRow.listenerVolume
			);
			await invoke("save_setting", {
				file_name: matchingRow.filename,
				keybind: matchingRow.keybind?.toUpperCase(),
				user_volume: matchingRow.userVolume,
				listener_volume: matchingRow.listenerVolume,
			});
		}
	}

	useEffect(() => {
		setSettings(noiseSettings);
	}, [noiseSettings]);

	useEffect(() => {
		async function fetchDurations() {
			const durations = await Promise.all(
				// Assert that settings is not undefined because the trigger
				// for the function requires it to be defined
				settings!.map(async (setting) => {
					const duration = await invoke("get_sound_duration", {
						filename: setting.filename,
					});
					return duration as number;
				})
			);
			setDurations(durations);
		}

		console.info("Settings", settings);

		if (settings) {
			fetchDurations();
		}
	}, [settings]);

	return (
		<div className="p-4 border border-neutral-700 bg-neutral-900">
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
					{settings?.map((setting, idx) => {
						return (
							<tr key={idx}>
								<td className="text-left">
									{setting.filename.length > 20
										? setting.filename.slice(0, 20) + "..."
										: setting.filename}
								</td>
								<td>{durations[idx]}s</td>
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
											id={`newKeybind-${idx}`}
											maxLength={1}
											placeholder={setting.keybind?.toUpperCase() || "?"}
											style={{ textTransform: "uppercase" }}
											onChange={(e) => {
												const nextSettings = settings?.map((nextSetting) => {
													if (nextSetting.filename === setting.filename) {
														return {
															filename: nextSetting.filename,
															keybind: e.target.value.toUpperCase(),
															userVolume: nextSetting.userVolume,
															listenerVolume: nextSetting.listenerVolume,
														};
													} else {
														return nextSetting;
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
											id={`newUserVolume-${idx}`}
											min={0}
											max={200}
											placeholder={setting?.userVolume.toString() || "1"}
											onChange={(e) => {
												const userVolume = parseInt(e.target.value);
												const nextSettings = settings?.map((nextSetting) => {
													if (nextSetting.filename === setting.filename) {
														return {
															filename: nextSetting.filename,
															keybind: nextSetting.keybind,
															userVolume: userVolume,
															listenerVolume: nextSetting.listenerVolume,
														};
													} else {
														return nextSetting;
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
											id={`newListenerVolume-${idx}`}
											min={0}
											max={200}
											placeholder={setting?.listenerVolume.toString() || "1"}
											onChange={(e) => {
												const listenerVolume = parseInt(e.target.value, 10);
												const nextSettings = settings?.map((nextSetting) => {
													if (nextSetting.filename === setting.filename) {
														return {
															filename: nextSetting.filename,
															keybind: nextSetting.keybind,
															userVolume: nextSetting.userVolume,
															listenerVolume: listenerVolume,
														};
													} else {
														return nextSetting;
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
										onClick={async () => await handleSaveSetting(setting)}
									>
										Save
									</button>
								</td>
								<td>
									<button
										className="px-3 py-1 text-sm bg-black border border-neutral-800 hover:border-white transition-all duration-150 hover:shadow-neutral-500 hover:shadow-sm"
										onClick={() => playSound(setting)}
									>
										Preview
									</button>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};

export default NoiseTable;
