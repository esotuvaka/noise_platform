interface File {
	filename: string;
	path: string;
	duration: number;
	keybind: string;
	volume: number;
}

interface Setting {
	filename: string;
	letter: string;
	userVolume: number;
	listenerVolume: number;
}

interface SettingsFile {
	inputDevice: string;
	outputDevice: string;
	audioSettings: Setting[];
}
