import { useState } from "react";
import { Button, Dropdown, Modal } from "@heroui/react";
import { FirebaseAPI, TOrganization } from "@jsdev_ninja/core";
import { useAppSelector, useStoreActions } from "src/infra";
import { FirebaseApi } from "src/lib/firebase";
import { TCart } from "src/domains/cart";
import { Icon } from "src/components";

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

	const hasActive = !!activeOrganization;

	return (
		<>
			{/* Prominent centered banner — impossible to miss for multi-org customers */}
			<div
				className={`w-full border-b ${
					hasActive
						? "bg-default-100 border-default-200"
						: "bg-primary-50 border-primary-200"
				}`}
			>
				<div className="mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 py-2.5 text-center">
					<span
						className={`flex items-center gap-1.5 text-sm font-medium ${
							hasActive ? "text-default-700" : "text-primary-700"
						}`}
					>
						<Icon name="building" size="sm" />
						{hasActive ? "מזמינים עבור:" : "יש לבחור ארגון לפני שמתחילים בהזמנה"}
					</span>
					<Dropdown>
						<Dropdown.Trigger>
							<Button
								variant={hasActive ? "secondary" : "primary"}
								size="sm"
								className="gap-1.5"
								aria-label={
									hasActive ? `ארגון נבחר: ${activeOrganization?.name}` : "בחר ארגון"
								}
							>
								{hasActive ? (
									<span className="font-medium max-w-[14rem] truncate">
										{activeOrganization?.name}
									</span>
								) : (
									<span className="font-medium">בחר ארגון</span>
								)}
								<Icon name="chevronDown" size="sm" />
							</Button>
						</Dropdown.Trigger>
						<Dropdown.Popover>
							<Dropdown.Menu
								aria-label="בחירת ארגון"
								selectedKeys={
									activeOrganization ? new Set([activeOrganization.id]) : new Set()
								}
								selectionMode="single"
								onAction={(key) => handleSelect(key as string)}
								items={organizations}
							>
								{(org) => (
									<Dropdown.Item id={org.id} textValue={org.name}>
										{org.name}
									</Dropdown.Item>
								)}
							</Dropdown.Menu>
						</Dropdown.Popover>
					</Dropdown>
				</div>
			</div>

			<Modal.Backdrop
				isOpen={isConfirmOpen}
				onOpenChange={(open) => {
					setIsConfirmOpen(open);
					if (!open) setPendingOrg(null);
				}}
			>
				<Modal.Container>
					<Modal.Dialog>
						<Modal.Header>
							<Modal.Heading>החלפת ארגון</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<p>החלפת ארגון תרוקן את העגלה. להמשיך?</p>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="ghost" onPress={handleCancel}>
								ביטול
							</Button>
							<Button variant="primary" onPress={handleConfirm}>
								אישור
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</>
	);
}
