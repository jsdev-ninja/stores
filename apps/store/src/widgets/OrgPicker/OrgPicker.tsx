import { useState } from "react";
import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from "@heroui/react";
import { FirebaseAPI, TOrganization } from "@jsdev_ninja/core";
import { useAppSelector, useStoreActions } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { TCart } from "src/domains/cart";

export function OrgPicker() {
	const actions = useStoreActions();

	const organizations = useAppSelector((state) => state.userOrganization.organizations);
	const activeOrganization = useAppSelector((state) => state.userOrganization.activeOrganization);
	const currentCart = useAppSelector((state) => state.cart.currentCart);
	const companyId = useAppSelector((state) => state.company.data?.id);
	const storeId = useAppSelector((state) => state.store.data?.id);

	const [pendingOrg, setPendingOrg] = useState<TOrganization | null>(null);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	if (organizations.length < 2) {
		return null;
	}

	const handleSelect = (key: string) => {
		const selected = organizations.find((org) => org.id === key);
		if (!selected || selected.id === activeOrganization?.id) return;
		setPendingOrg(selected);
		setIsConfirmOpen(true);
	};

	const handleConfirm = () => {
		if (!pendingOrg) return;
		// Clear cart in Firestore so the subscription stays in sync
		if (currentCart && companyId && storeId) {
			FirebaseApi.firestore.setV2<TCart>({
				collection: FirebaseAPI.firestore.getPath({
					companyId,
					storeId,
					collectionName: "cart",
				}),
				doc: {
					...currentCart,
					items: [],
				},
			});
		}
		actions.dispatch(actions.userOrganization.setActiveOrganization(pendingOrg));
		setPendingOrg(null);
		setIsConfirmOpen(false);
	};

	const handleCancel = () => {
		setPendingOrg(null);
		setIsConfirmOpen(false);
	};

	return (
		<>
			<Dropdown>
				<DropdownTrigger>
					<Button variant="flat" size="sm">
						{activeOrganization?.name ?? "בחר ארגון"}
					</Button>
				</DropdownTrigger>
				<DropdownMenu
					aria-label="בחירת ארגון"
					selectedKeys={activeOrganization ? new Set([activeOrganization.id]) : new Set()}
					selectionMode="single"
					onAction={(key) => handleSelect(key as string)}
					items={organizations}
				>
					{(org) => <DropdownItem key={org.id}>{org.name}</DropdownItem>}
				</DropdownMenu>
			</Dropdown>

			<Modal isOpen={isConfirmOpen} onOpenChange={(open) => {
				setIsConfirmOpen(open);
				if (!open) setPendingOrg(null);
			}}>
				<ModalContent>
					{() => (
						<>
							<ModalHeader>החלפת ארגון</ModalHeader>
							<ModalBody>
								<p>החלפת ארגון תרוקן את העגלה. להמשיך?</p>
							</ModalBody>
							<ModalFooter>
								<Button variant="light" onPress={handleCancel}>
									ביטול
								</Button>
								<Button color="primary" onPress={handleConfirm}>
									אישור
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
