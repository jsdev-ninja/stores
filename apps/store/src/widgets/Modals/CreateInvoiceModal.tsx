import { useEffect, useState, useCallback } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { Select, SelectItem } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Form } from "src/components/Form";
import { Button } from "src/components/button";
import { modalApi } from "src/infra/modals";
import { Icon } from "@iconify/react";
import { TOrganization, TOrder } from "@jsdev_ninja/core";
import { z } from "zod";
import { useFormContext } from "react-hook-form";

const CreateInvoiceSchema = z.object({
	organizationId: z.string().min(1, "Organization is required"),
	billingAccount: z.string().optional(),
	fromDate: z.number().min(1, "From date is required"),
	toDate: z.number().min(1, "To date is required"),
});

type TCreateInvoice = z.infer<typeof CreateInvoiceSchema>;

function FormContent({ 
	organizations, 
	loading, 
	orders, 
	isLoadingOrders,
	hasSearched
}: { 
	organizations: TOrganization[]; 
	loading: boolean; 
	orders: TOrder[]; 
	isLoadingOrders: boolean; 
	hasSearched: boolean;
}) {
	const { t } = useTranslation(["common"]);
	const { setValue, watch } = useFormContext<TCreateInvoice>();
	
	const organizationId = watch("organizationId");
	const billingAccount = watch("billingAccount");

	// Get billing accounts for the selected organization
	const selectedOrganization = organizations.find(org => org.id === organizationId);
	const billingAccounts = selectedOrganization?.billingAccounts || [];

	// Clear billing account when organization changes
	useEffect(() => {
		if (organizationId && billingAccount) {
			const selectedOrg = organizations.find(org => org.id === organizationId);
			const hasBillingAccount = selectedOrg?.billingAccounts.some(acc => acc.number === billingAccount);
			if (!hasBillingAccount) {
				setValue("billingAccount", "");
			}
		}
	}, [organizationId, billingAccount, organizations, setValue]);

	// Helper functions to get organization and billing account names
	const getOrganizationName = (orgId: string) => {
		const org = organizations.find(o => o.id === orgId);
		return org?.name || 'לא ידוע';
	};

	const getBillingAccountName = (orgId: string, billingAccountNumber: string) => {
		const org = organizations.find(o => o.id === orgId);
		const account = org?.billingAccounts.find(acc => acc.number === billingAccountNumber);
		return account ? `${account.name} (${account.number})` : 'לא נבחר';
	};

	return (
		<>
			<ModalHeader className="flex flex-col gap-1">
				<h3 className="text-lg font-semibold">{t("createInvoice")}</h3>
				<p className="text-sm text-default-500">
					בחר ארגון וטווח תאריכים ליצירת חשבונית
				</p>
			</ModalHeader>
			<ModalBody className="p-4 md:p-5 grid grid-cols-1 gap-4">
				<div className="flex flex-col gap-2">
					<label className="block text-sm font-medium text-gray-900 dark:text-white">
						{t("selectOrganization")}
					</label>
					<Select
						placeholder={t("selectOrganization")}
						isDisabled={loading}
						selectedKeys={organizationId ? [organizationId] : []}
						onChange={(e) => {
							setValue("organizationId", e.target.value);
						}}
						startContent={
							<Icon icon="lucide:building-2" className="text-default-400" />
						}
						items={organizations}
					>
						{(org) => (
							<SelectItem textValue={org.name} key={org.id}>
								{org.name}
								{"discountPercentage" in org &&
									org.discountPercentage &&
									` (${org.discountPercentage}% הנחה)`}
							</SelectItem>
						)}
					</Select>
				</div>

				<div className="flex flex-col gap-2">
					<label className="block text-sm font-medium text-gray-900 dark:text-white">
						חשבון חיוב
					</label>
					<Select
						placeholder="בחר חשבון חיוב (אופציונלי)"
						isDisabled={!organizationId || loading}
						selectedKeys={billingAccount ? [billingAccount] : []}
						onChange={(e) => {
							setValue("billingAccount", e.target.value);
						}}
						startContent={
							<Icon icon="lucide:credit-card" className="text-default-400" />
						}
						items={billingAccounts}
					>
						{(account) => (
							<SelectItem textValue={`${account.name} (${account.number})`} key={account.number}>
								{account.name} ({account.number})
							</SelectItem>
						)}
					</Select>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<Form.Input<TCreateInvoice>
						name="fromDate"
						label={t("fromDate")}
						type="date"
						placeholder="Select start date"
						defaultValue={new Date(watch("fromDate") || Date.now()).toISOString().split("T")[0]}
					/>
					<Form.Input<TCreateInvoice>
						name="toDate"
						label={t("toDate")}
						type="date"
						placeholder="Select end date"
						defaultValue={new Date(watch("toDate") || Date.now()).toISOString().split("T")[0]}
					/>
				</div>

				{/* Orders Results */}
				{isLoadingOrders && (
					<div className="flex justify-center py-4">
						<div className="text-sm text-gray-500">טוען הזמנות...</div>
					</div>
				)}

				{!isLoadingOrders && orders.length > 0 && (
					<div className="mt-4">
						<h4 className="text-lg font-medium mb-3">הזמנות שנמצאו ({orders.length})</h4>
						<div className="max-h-60 overflow-y-auto border rounded-lg">
							<table className="w-full">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">הזמנה</th>
										<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
										<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">לקוח</th>
										<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ארגון</th>
										<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">חשבון חיוב</th>
										<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סכום</th>
										<th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{orders.map((order) => (
										<tr key={order.id} className="hover:bg-gray-50">
											<td className="px-3 py-2 text-sm font-medium text-gray-900">
												#{order.id.slice(-8)}
											</td>
											<td className="px-3 py-2 text-sm text-gray-500">
												{new Date(order.date).toLocaleDateString('he-IL')}
											</td>
											<td className="px-3 py-2 text-sm text-gray-500">
												{order.client?.displayName}
											</td>
											<td className="px-3 py-2 text-sm text-gray-500">
												{getOrganizationName(order.organizationId || '')}
											</td>
											<td className="px-3 py-2 text-sm text-gray-500">
												{order.billingAccount ? getBillingAccountName(order.organizationId || '', order.billingAccount.number) : 'לא נבחר'}
											</td>
											<td className="px-3 py-2 text-sm font-medium text-gray-900">
												₪{order.cart.cartTotal.toFixed(2)}
											</td>
											<td className="px-3 py-2 text-sm text-gray-500">
												<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													order.status === 'completed' ? 'bg-green-100 text-green-800' :
													order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
													order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
													order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
													'bg-gray-100 text-gray-800'
												}`}>
													{order.status}
												</span>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{!isLoadingOrders && hasSearched && orders.length === 0 && (
					<div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
						<div className="flex items-center">
							<Icon icon="lucide:alert-circle" className="h-5 w-5 text-yellow-400 mr-2" />
							<div className="text-sm text-yellow-800">
								לא נמצאו הזמנות עבור הארגון והתאריכים שנבחרו
							</div>
						</div>
					</div>
				)}
			</ModalBody>
			<ModalFooter>
				<Button
					onPress={() => modalApi.closeModal("createInvoice")}
					color="danger"
					variant="light"
				>
					{t("cancel")}
				</Button>
				<Button type="submit" color="primary" isLoading={isLoadingOrders}>
					{isLoadingOrders ? "טוען..." : t("generateInvoice")}
				</Button>
			</ModalFooter>
		</>
	);
}

export function CreateInvoiceModal({ onOrdersFound }: { onOrdersFound?: (orders: TOrder[]) => void }) {
	const appApi = useAppApi();
	
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [loading, setLoading] = useState(false);
	const [orders, setOrders] = useState<TOrder[]>([]);
	const [isLoadingOrders, setIsLoadingOrders] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);

	const loadOrganizations = useCallback(async () => {
		setLoading(true);
		try {
			const result = await appApi.admin.listOrganizations();
			if (result?.success) {
				setOrganizations(result.data || []);
			}
		} catch (error) {
			console.error("Failed to load organizations:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	// Load organizations on component mount
	useEffect(() => {
		loadOrganizations();
	}, [loadOrganizations]);

	// Set default date range (first day of current month to last day of current month)
	const today = new Date();
	const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
	const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
	
	const defaultFromDate = firstDayOfMonth.getTime();
	const defaultToDate = lastDayOfMonth.getTime();

	return (
		<Modal
			scrollBehavior="inside"
			placement="top-center"
			isOpen
			onClose={() => modalApi.closeModal("createInvoice")}
			size="lg"
		>
			<Form<TCreateInvoice>
				onSubmit={async (data) => {
					setIsLoadingOrders(true);
					setHasSearched(true);
					try {
						const result = await appApi.admin.getOrdersForInvoice({
							organizationId: data.organizationId,
							billingAccount: data.billingAccount,
							fromDate: data.fromDate,
							toDate: data.toDate,
						});
						
						if (result?.success) {
							const foundOrders = result.data || [];
							setOrders(foundOrders);

							// If orders found, close modal and pass results to parent
							if (foundOrders.length > 0) {
								onOrdersFound?.(foundOrders);
								modalApi.closeModal("createInvoice");
							}
						}
					} catch (error) {
						console.error("Failed to fetch orders:", error);
						setOrders([]);
					} finally {
						setIsLoadingOrders(false);
					}
				}}
				onError={() => {}}
				defaultValues={{
					organizationId: "",
					billingAccount: "",
					fromDate: defaultFromDate,
					toDate: defaultToDate,
				}}
				schema={CreateInvoiceSchema}
				className=""
			>
				<ModalContent>
					<FormContent 
						organizations={organizations} 
						loading={loading} 
						orders={orders}
						isLoadingOrders={isLoadingOrders}
						hasSearched={hasSearched}
					/>
				</ModalContent>
			</Form>
		</Modal>
	);
}
