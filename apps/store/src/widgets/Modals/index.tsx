import { AuthModal } from "src/features/auth";
import { CategoryFormModal } from "src/features/category/CategoryFormModal";
import { modalsSlice } from "src/infra/modals";

import { AnimatePresence } from "framer-motion";
import { ReactNode, cloneElement } from "react";
import { useAppSelector } from "src/infra";
import { CreateInvoiceModal } from "./CreateInvoiceModal";
import { InvoiceDetailsModal } from "./InvoiceDetailsModal";
import { OrderDetailsModal } from "./OrderDetailsModal";
import { OrderPickingModal } from "./OrderPickingModal";
import { OrderEditModal } from "./OrderEditModal";
import { CreateDeliveryNoteModal } from "./CreateDeliveryNoteModal";
import { SelectDateForDocumentModal } from "./SelectDateForDocumentModal";
import { ConfirmModal } from "./ConfirmModal";
import { AdminCreateOrderModal } from "./AdminCreateOrderModal";
import { AccountModal } from "./AccountModal";
import { RecordInvoicePaymentModal } from "./RecordInvoicePaymentModal";
import { TOrder } from "@jsdev_ninja/core";
import type { OpenInvoiceRow } from "src/lib/firebase/api";

export const ModalsContainer = ({ children }: { children: ReactNode }) => {
	return <AnimatePresence>{children}</AnimatePresence>;
};

export const modals = {
	authModal: () => <AuthModal />,
	accountModal: () => <AccountModal />,
	categoryFormModal: ({ categoryId, onSave }: { categoryId: string; onSave?: any }) => (
		<CategoryFormModal categoryId={categoryId} onSave={onSave} />
	),
	createInvoice: ({ onOrdersFound }: { onOrdersFound?: (orders: any[]) => void }) => (
		<CreateInvoiceModal onOrdersFound={onOrdersFound} />
	),
	orderDetails: ({
		order,
		onUpdated,
	}: {
		order: TOrder;
		onUpdated?: (order: TOrder) => void;
	}) => <OrderDetailsModal order={order} onUpdated={onUpdated} />,
	orderPicking: ({ order, onSaved }: { order: TOrder; onSaved?: (order: TOrder) => void }) => (
		<OrderPickingModal order={order} onSaved={onSaved} />
	),
	orderEdit: ({ order, onSaved }: { order: TOrder; onSaved?: (order: TOrder) => void }) => (
		<OrderEditModal order={order} onSaved={onSaved} />
	),
	invoiceDetails: ({
		selectedOrders,
		onInvoiceCreated,
		initialInvoiceDate,
		linkedDeliveryNote,
		requireAllocation,
	}: {
		selectedOrders: TOrder[];
		onInvoiceCreated?: () => void;
		initialInvoiceDate?: number;
		linkedDeliveryNote?: { docUuid: string; number?: string };
		requireAllocation?: boolean;
	}) => (
		<InvoiceDetailsModal
			selectedOrders={selectedOrders}
			onInvoiceCreated={onInvoiceCreated}
			initialInvoiceDate={initialInvoiceDate}
			linkedDeliveryNote={linkedDeliveryNote}
			requireAllocation={requireAllocation}
		/>
	),
	createDeliveryNote: ({ onDeliveryNoteCreated }: { onDeliveryNoteCreated?: () => void }) => (
		<CreateDeliveryNoteModal onDeliveryNoteCreated={onDeliveryNoteCreated} />
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
	adminCreateOrder: ({ onOrderCreated }: { onOrderCreated?: (order: TOrder) => void }) => (
		<AdminCreateOrderModal onOrderCreated={onOrderCreated} />
	),
	recordInvoicePayment: ({
		row,
		onPaymentRecorded,
	}: {
		row: OpenInvoiceRow;
		onPaymentRecorded: (receipt: { doc_uuid: string; pdf_link: string; doc_number: string }) => void;
	}) => <RecordInvoicePaymentModal row={row} onPaymentRecorded={onPaymentRecorded} />,
	confirmModal: ({
		title,
		message,
		confirmText,
		cancelText,
		danger,
		onConfirm,
	}: {
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		danger?: boolean;
		onConfirm: () => void | Promise<void>;
	}) => (
		<ConfirmModal
			title={title}
			message={message}
			confirmText={confirmText}
			cancelText={cancelText}
			danger={danger}
			onConfirm={onConfirm}
		/>
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
