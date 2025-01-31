/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_STORE_VERSION: string;
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
