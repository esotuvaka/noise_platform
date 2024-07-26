export interface File {
	filename: string;
	path: string;
	duration: number;
	keybind: string;
	userVolume: number;
	listenerVolume: number;
}

export interface Setting {
	filename: string;
	keybind: string;
	userVolume: number;
	listenerVolume: number;
}

export interface SettingsFile {
	inputDevice: string;
	outputDevice: string;
	noiseSettings: Setting[];
}
