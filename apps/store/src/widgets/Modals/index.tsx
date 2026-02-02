import { AuthModal } from "src/features/auth";
import { CategoryFormModal } from "src/features/category/CategoryFormModal";
import { modalsSlice } from "src/infra/modals";

import { AnimatePresence } from "framer-motion";
import { ReactNode, cloneElement } from "react";
import { useAppSelector } from "src/infra";
import { AdminCompanyCreateModal } from "./modals/AdminCompanyCreateModal";
import { CreateInvoiceModal } from "./CreateInvoiceModal";
import { InvoiceDetailsModal } from "./InvoiceDetailsModal";
import { CreateDeliveryNoteModal } from "./CreateDeliveryNoteModal";
import { DeliveryNoteDetailsModal } from "./DeliveryNoteDetailsModal";
import { SelectDateForDocumentModal } from "./SelectDateForDocumentModal";
import { TOrder } from "@jsdev_ninja/core";

export const ModalsContainer = ({ children }: { children: ReactNode }) => {
	return <AnimatePresence>{children}</AnimatePresence>;
};

export const modals = {
	authModal: () => <AuthModal />,
	AdminCompanyCreateModal: () => <AdminCompanyCreateModal />,
	categoryFormModal: ({ categoryId, onSave }: { categoryId: string; onSave?: any }) => (
		<CategoryFormModal categoryId={categoryId} onSave={onSave} />
	),
	createInvoice: ({ onOrdersFound }: { onOrdersFound?: (orders: any[]) => void }) => (
		<CreateInvoiceModal onOrdersFound={onOrdersFound} />
	),
	invoiceDetails: ({
		selectedOrders,
		onInvoiceCreated,
		initialInvoiceDate,
	}: {
		selectedOrders: TOrder[];
		onInvoiceCreated?: () => void;
		initialInvoiceDate?: number;
	}) => (
		<InvoiceDetailsModal
			selectedOrders={selectedOrders}
			onInvoiceCreated={onInvoiceCreated}
			initialInvoiceDate={initialInvoiceDate}
		/>
	),
	createDeliveryNote: ({ onDeliveryNoteCreated }: { onDeliveryNoteCreated?: () => void }) => (
		<CreateDeliveryNoteModal onDeliveryNoteCreated={onDeliveryNoteCreated} />
	),
	deliveryNoteDetails: ({
		selectedOrders,
		onDeliveryNoteCreated,
	}: {
		selectedOrders: TOrder[];
		onDeliveryNoteCreated?: () => void;
	}) => (
		<DeliveryNoteDetailsModal
			selectedOrders={selectedOrders}
			onDeliveryNoteCreated={onDeliveryNoteCreated}
		/>
	),
	selectDateForDocument: ({
		documentType,
		onConfirm,
	}: {
		documentType: "deliveryNote" | "invoice";
		onConfirm: (date: number) => void | Promise<void>;
	}) => (
		<SelectDateForDocumentModal documentType={documentType} onConfirm={onConfirm} />
	),
};

export function ModalProvider() {
	const openModals = useAppSelector(modalsSlice.selectors.selectModals);

	return (
		<ModalsContainer>
			{openModals.map((modal) => {
				const component = modals[modal.id as keyof typeof modals](modal.props as any); //todo fix any

				return cloneElement(component, { key: modal.id });
			})}
		</ModalsContainer>
	);
}

declare global {
	type ModalType = typeof modals;
}
