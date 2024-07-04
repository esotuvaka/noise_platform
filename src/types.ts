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
	letter: string;
	userVolume: number;
	listenerVolume: number;
}

export interface SettingsFile {
	inputDevice: string;
	outputDevice: string;
	audioSettings: Setting[];
}
