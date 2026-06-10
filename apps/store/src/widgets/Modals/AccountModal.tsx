import { Suspense, lazy } from "react";
import { Modal } from "@heroui/react";
import { modalApi } from "src/infra/modals";

// Balasi "אזור אישי" content (store-scoped design), loaded on demand.
const AccountContent = lazy(() => import("src/websites/balasistore/AccountContent"));

export function AccountModal() {
	const close = () => modalApi.closeModal("accountModal");

	return (
		<Modal.Backdrop
			isOpen
			onOpenChange={(open) => {
				if (!open) close();
			}}
		>
			<Modal.Container size="lg" placement="center">
				<Modal.Dialog className="w-[94vw] max-w-[820px] overflow-hidden rounded-2xl p-0">
					<div className="max-h-[88vh] overflow-y-auto" dir="rtl">
						<Suspense fallback={null}>
							<AccountContent onClose={close} />
						</Suspense>
					</div>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}
