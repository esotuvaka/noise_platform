interface OutputDevicesModal {
	deviceType: string;
	devices: string[];
	show: boolean;
	onDeviceChange: (device: string) => void;
}

function DevicesModal({ devices, show, onDeviceChange }: OutputDevicesModal) {
	return (
		<div className={`devices-modal ${show ? "show" : "hide"}`}>
			<div>
				<select onChange={(e) => onDeviceChange(e.target.value)}>
					{devices.map((device, index) => {
						return <option key={index}>{device}</option>;
					})}
				</select>
			</div>
		</div>
	);
}

export default DevicesModal;
