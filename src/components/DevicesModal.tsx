interface OutputDevicesModal {
	deviceType: string;
	devices: string[];
	show: boolean;
	onDeviceChange: (device: string) => void;
}

function DevicesModal({ devices, show, onDeviceChange }: OutputDevicesModal) {
	return (
		<div className="h-8">
			{show === true ? (
				<div className="flex items-center">
					<select
						className="bg-black text-white px-1 py-0.5 mt-0.5"
						onChange={(e) => onDeviceChange(e.target.value)}
					>
						{devices.map((device, index) => {
							return <option key={index}>{device}</option>;
						})}
					</select>
				</div>
			) : (
				<></>
			)}
		</div>
	);
}

export default DevicesModal;
