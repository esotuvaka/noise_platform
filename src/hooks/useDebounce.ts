import { useEffect, useState } from "react";

function useDebounce<T>(inputValue: T, delay: number) {
	const [debouncedValue, setDebouncedValue] = useState<T>(inputValue);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(inputValue);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [inputValue, delay]);

	return debouncedValue;
}

export default useDebounce;
