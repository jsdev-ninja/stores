import { useEffect, useRef } from "react";

// Custom debounce hook
export function useDebounce<T extends (...args: any[]) => void>(
	callback: T,
	delay: number = 500
): T {
	const callbackRef = useRef<T>(callback);
	const timeoutRef = useRef<number | undefined>();

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	function debouncedFunction(this: any, ...args: Parameters<T>) {
		if (timeoutRef.current !== undefined) {
			clearTimeout(timeoutRef.current);
		}
		timeoutRef.current = window.setTimeout(() => {
			callbackRef.current.apply(this, args);
		}, delay);
	}

	return debouncedFunction as T;
}
