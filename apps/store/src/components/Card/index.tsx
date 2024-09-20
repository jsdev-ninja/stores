import { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
	return (
		<div className="block w-full text-gray-900 bg-white border border-t-0 border-gray-200 rounded-t-none shadow-sm sm:text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white block-canvas">
			{children}
		</div>
	);
}
