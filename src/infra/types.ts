// custom.d.ts
declare global {
	interface Document {
		startViewTransition?: (callback?: () => void) => void;
	}
}

export {};
