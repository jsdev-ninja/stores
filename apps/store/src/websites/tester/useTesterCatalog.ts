import { useCallback, useState } from "react";

type TesterCatalogState = {
	isAsideOpen: boolean;
	toggleAside: () => void;
	closeAside: () => void;
};

export function useTesterCatalog(): TesterCatalogState {
	const [isAsideOpen, setIsAsideOpen] = useState(false);

	const toggleAside = useCallback(() => setIsAsideOpen((prev) => !prev), []);
	const closeAside = useCallback(() => setIsAsideOpen(false), []);

	return { isAsideOpen, toggleAside, closeAside };
}
