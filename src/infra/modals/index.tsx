/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { store, useAppSelector } from "../store";
import { AddProductModal } from "src/features/product/addProduct/AddProductModal";
import { AuthModal } from "src/features/auth";

type Modal = {
	id: string;
	props?: object;
};

interface ModalsState {
	modals: Array<Modal>;
}

const modals = {
	addProduct: () => {
		return <AddProductModal />;
	},
	authModal: () => <AuthModal />,
};

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
	modals: modals,
	openModal: <T extends keyof typeof modals>(
		id: T,
		props?: Parameters<(typeof modals)[T]>[0] extends undefined //todo fix type
			? undefined
			: Parameters<(typeof modals)[T]>[0]
	) => {
		store.dispatch(modalsSlice.actions.openModal({ id, props }));
	},
	closeModal: () => {},
};

export function ModalProvider() {
	const openModals = useAppSelector(modalsSlice.selectors.selectModals);

	return (
		<>
			{openModals.map((modal) => {
				const component = modals[modal.id as keyof typeof modals] as any;
				return component(modal.props);
			})}
		</>
	);
}
