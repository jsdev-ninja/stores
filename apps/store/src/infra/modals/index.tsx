import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { store } from "../store";

type Modal = {
	id: string;
	props?: object;
};

interface ModalsState {
	modals: Array<Modal>;
}

// Define the initial state using that type
const initialState: ModalsState = {
	modals: [],
};

export const modalsSlice = createSlice({
	name: "modals",
	initialState,
	reducers: {
		openModal(state, action: PayloadAction<{ id: string; props?: object }>) {
			state.modals.push(action.payload);
		},
		closeModal(state, action: PayloadAction<Modal["id"]>) {
			state.modals = state.modals.filter((modal) => modal.id !== action.payload);
		},
	},
	selectors: {
		selectModals: (state) => state.modals,
	},
});

export const modalApi = {
	openModal: <T extends keyof ModalType>(
		id: T,
		props?: Parameters<ModalType[T]>[0] extends undefined //todo fix type
			? undefined
			: Parameters<ModalType[T]>[0]
	) => {
		store.dispatch(modalsSlice.actions.openModal({ id, props }));
	},
	closeModal: <T extends keyof ModalType>(id: T) => {
		store.dispatch(modalsSlice.actions.closeModal(id));
	},
};
