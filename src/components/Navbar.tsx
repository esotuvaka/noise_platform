import { AiOutlineAudio } from "react-icons/ai";
import { FaRegFolderOpen } from "react-icons/fa";
import { FiHeadphones } from "react-icons/fi";
import { IoRefresh } from "react-icons/io5";
import DevicesModal from "./DevicesModal";
import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";

interface Navbar {
	audioDevices: [string[], string[]];
	handleRefresh: () => void;
}

const Navbar = ({ audioDevices, handleRefresh }: Navbar) => {
	const [activeInputDevice, setActiveInputDevice] = useState<string>("");
	const [activeOutputDevice, setActiveOutputDevice] = useState<string>("");

	const [showInputDevices, setShowInputDevices] = useState<boolean>(false);
	const [showOutputDevices, setShowOutputDevices] = useState<boolean>(false);

	async function saveAudioDevices(inputDevice: string, outputDevice: string) {
		await invoke("save_audio_devices", {
			input_device: inputDevice,
			output_device: outputDevice,
		});
	}

	async function openSoundsFolder() {
		// The sounds folder should exist when we invoke this Rust API
		// If it doesn't, Rust will create it or return an error
		await invoke("open_sounds_folder");
	}

	return (
		<nav className="flex justify-center items-center p-4 z-10 w-full absolute top-0 right-0">
			<div className="flex justify-end gap-2 mr-4 items-center w-full">
				<DevicesModal
					deviceType="input"
					devices={audioDevices[0]}
					show={showInputDevices}
					onDeviceChange={(device: string) => {
						setActiveInputDevice(device);
						saveAudioDevices(device, activeOutputDevice);
					}}
				/>
				<div className="flex items-center text-neutral-200 text-xl hover:cursor-pointer hover:text-white transition-all duration-150">
					<span
						onClick={() => {
							setShowInputDevices(!showInputDevices);
							setShowOutputDevices(false);
						}}
					>
						<AiOutlineAudio />
					</span>
				</div>
				<DevicesModal
					deviceType="output"
					devices={audioDevices[1]}
					show={showOutputDevices}
					onDeviceChange={(device: string) => {
						setActiveOutputDevice(device);
						saveAudioDevices(activeInputDevice, device);
					}}
				/>
				<div className="flex items-center text-neutral-200 text-xl hover:cursor-pointer hover:text-white transition-all duration-150">
					<span
						onClick={() => {
							setShowOutputDevices(!showOutputDevices);
							setShowInputDevices(false);
						}}
					>
						<FiHeadphones />
					</span>
				</div>
				<span /> {/* Included just so we have equal spacing */}
				<div className="flex items-center text-neutral-200 text-xl hover:cursor-pointer hover:text-white transition-all duration-150">
					<span
						onClick={(e) => {
							e.preventDefault();
							openSoundsFolder();
						}}
					>
						<FaRegFolderOpen />
					</span>
				</div>
				<span /> {/* Included just so we have equal spacing */}
				<div className="flex items-center text-neutral-200 text-xl hover:cursor-pointer hover:text-white transition-all duration-150">
					<span
						onClick={(e) => {
							e.preventDefault();
							handleRefresh();
						}}
					>
						<IoRefresh />
					</span>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
