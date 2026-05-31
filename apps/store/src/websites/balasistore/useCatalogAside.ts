import { useCallback, useState } from "react";

type CatalogAsideState = {
	isAsideOpen: boolean;
	toggleAside: () => void;
	closeAside: () => void;
};

export function useCatalogAside(): CatalogAsideState {
	const [isAsideOpen, setIsAsideOpen] = useState(false);

	const toggleAside = useCallback(() => setIsAsideOpen((prev) => !prev), []);
	const closeAside = useCallback(() => setIsAsideOpen(false), []);

	return { isAsideOpen, toggleAside, closeAside };
}
