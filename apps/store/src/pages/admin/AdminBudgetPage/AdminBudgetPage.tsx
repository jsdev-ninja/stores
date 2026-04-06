import { useEffect, useState } from "react";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Chip,
	Spinner,
	Select,
	SelectItem,
	Textarea,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
} from "@heroui/react";
import { Button } from "src/components/button";
import { Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { navigate, useParams } from "src/navigation";
import { FirebaseApi } from "src/lib/firebase";
import { DateView } from "src/components/DateView";
import { Price } from "src/components/Price";

type TBudgetAccount = {
	id: string;
	organizationId: string;
	organizationName: string;
	companyId: string;
	storeId: string;
	totalDebits: number;
	totalCredits: number;
	balance: number;
	currency: "ILS";
	updatedAt: number;
};

type TBudgetTransactionType =
	| "delivery_note"
	| "payment_received"
	| "credit_note"
	| "debit_note"
	| "order_created"
	| "order_cancelled"
	| "order_refunded";

type TPaymentMethod = "check" | "bank_transfer" | "cash" | "credit_card" | "other";

type TBudgetTransaction = {
	id: string;
	type: TBudgetTransactionType;
	debt: number;
	runningBalance: number;
	orderId: string | null;
	orderTotal: number | null;
	deliveryNoteId: string | null;
	deliveryNoteNumber: string | null;
	billingAccountId: string | null;
	billingAccountName: string | null;
	billingAccountNumber: string | null;
	paymentReference: string | null;
	paymentDate: number | null;
	paymentMethod: TPaymentMethod | null;
	note: string | null;
	createdAt: number;
	createdBy: string;
};

// ─── List page ───────────────────────────────────────────────────────────────

export function AdminBudgetPage() {
	const { t } = useTranslation(["common", "admin"]);
	const [accounts, setAccounts] = useState<TBudgetAccount[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		FirebaseApi.api.listBudgetAccounts()
			.then((res) => {
				if (res.success) setAccounts((res.data ?? []) as TBudgetAccount[]);
			})
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">{t("admin:budget.title", "ניהול תקציב")}</h1>
			</div>

			{accounts.length === 0 ? (
				<div className="text-center py-16 text-gray-400">
					<Icon icon="lucide:wallet" className="mx-auto mb-3 text-4xl" />
					<p>{t("admin:budget.noAccounts", "אין חובות פתוחים")}</p>
				</div>
			) : (
				<Table aria-label="budget accounts">
					<TableHeader>
						<TableColumn>{t("common:organization", "ארגון")}</TableColumn>
						<TableColumn>{t("admin:budget.totalDebits", "סה״כ חיובים")}</TableColumn>
						<TableColumn>{t("admin:budget.totalCredits", "סה״כ תשלומים")}</TableColumn>
						<TableColumn>{t("admin:budget.balance", "יתרת חוב")}</TableColumn>
						<TableColumn>{t("common:actionsLabel", "פעולות")}</TableColumn>
					</TableHeader>
					<TableBody>
						{accounts.map((acc) => (
							<TableRow key={acc.id}>
								<TableCell className="font-medium">{acc.organizationName}</TableCell>
								<TableCell>
									<Price price={acc.totalDebits} />
								</TableCell>
								<TableCell>
									<Price price={acc.totalCredits} />
								</TableCell>
								<TableCell>
									<Chip
										color={acc.balance > 0 ? "danger" : acc.balance < 0 ? "success" : "default"}
										variant="flat"
									>
										<Price price={acc.balance} />
									</Chip>
								</TableCell>
								<TableCell>
									<Button
										size="sm"
										variant="light"
										onPress={() =>
											navigate({
												to: "admin.budgetOrganization",
												params: { organizationId: acc.organizationId },
											})
										}
									>
										{t("common:view", "צפה")}
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}

// ─── Detail page (per organization) ──────────────────────────────────────────

const TX_TYPE_LABELS: Record<TBudgetTransactionType, string> = {
	delivery_note: "תעודת משלוח",
	payment_received: "תשלום",
	credit_note: "זיכוי",
	debit_note: "חיוב ידני",
	order_created: "הזמנה נוצרה",
	order_cancelled: "הזמנה בוטלה",
	order_refunded: "הזמנה זוכתה",
};

// Only these 3 types are shown in the ledger
const VISIBLE_TX_TYPES: TBudgetTransactionType[] = ["delivery_note", "payment_received", "credit_note"];

function txColor(type: TBudgetTransactionType): "success" | "danger" | "default" {
	if (["payment_received", "credit_note", "order_cancelled", "order_refunded"].includes(type)) return "success";
	if (["delivery_note", "debit_note", "order_created"].includes(type)) return "danger";
	return "default";
}

type BillingAccountEntry = {
	id: string;
	name: string;
	number: string;
};

export function AdminBudgetOrganizationPage() {
	const { t } = useTranslation(["common", "admin"]);
	const { organizationId } = useParams("admin.budgetOrganization");

	const [account, setAccount] = useState<TBudgetAccount | null>(null);
	const [transactions, setTransactions] = useState<TBudgetTransaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [billingAccountFilter, setBillingAccountFilter] = useState<string>("");

	// manual transaction modal
	const [manualModal, setManualModal] = useState(false);
	const [manualType, setManualType] = useState<"credit_note" | "debit_note">("credit_note");
	const [manualAmount, setManualAmount] = useState("");
	const [manualNote, setManualNote] = useState("");
	const [manualLoading, setManualLoading] = useState(false);

	const load = async (billingAccountId?: string) => {
		if (!organizationId) return;
		setLoading(true);
		try {
			const [accRes, txRes] = await Promise.all([
				FirebaseApi.api.getBudgetAccount(organizationId),
				FirebaseApi.api.getBudgetTransactions(organizationId, billingAccountId || undefined),
			]);
			if (accRes.success) setAccount(accRes.data as TBudgetAccount | null);
			if (txRes.success) setTransactions((txRes.data ?? []) as unknown as TBudgetTransaction[]);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load(billingAccountFilter || undefined);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [organizationId, billingAccountFilter]);

	// collect unique billing accounts from transactions for filter dropdown
	const billingAccounts: BillingAccountEntry[] = [];
	const seen = new Set<string>();
	for (const tx of transactions) {
		if (tx.billingAccountId && !seen.has(tx.billingAccountId)) {
			seen.add(tx.billingAccountId);
			billingAccounts.push({
				id: tx.billingAccountId,
				name: tx.billingAccountName ?? tx.billingAccountId,
				number: tx.billingAccountNumber ?? "",
			});
		}
	}

	const submitManual = async () => {
		const debt = parseFloat(manualAmount);
		if (!debt || !manualNote.trim() || !account || !organizationId) return;
		setManualLoading(true);
		await FirebaseApi.api.addBudgetManualTransaction({
			organizationId,
			organizationName: account.organizationName,
			type: manualType,
			debt,
			note: manualNote.trim(),
		});
		setManualModal(false);
		setManualAmount("");
		setManualNote("");
		setManualLoading(false);
		load(billingAccountFilter || undefined);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Button
					size="sm"
					variant="light"
					isIconOnly
					onPress={() => navigate({ to: "admin.budget" })}
				>
					<Icon icon="lucide:arrow-right" />
				</Button>
				<h1 className="text-2xl font-bold">
					{account?.organizationName ?? organizationId}
				</h1>
			</div>

			{/* Summary cards */}
			{account && (
				<div className="grid grid-cols-3 gap-4">
					<div className="rounded-xl border p-4 space-y-1">
						<p className="text-sm text-gray-500">{t("admin:budget.totalDebits", "סה״כ חיובים")}</p>
						<p className="text-xl font-bold text-red-600">
							<Price price={account.totalDebits} />
						</p>
					</div>
					<div className="rounded-xl border p-4 space-y-1">
						<p className="text-sm text-gray-500">{t("admin:budget.totalCredits", "סה״כ תשלומים")}</p>
						<p className="text-xl font-bold text-green-600">
							<Price price={account.totalCredits} />
						</p>
					</div>
					<div className="rounded-xl border p-4 space-y-1">
						<p className="text-sm text-gray-500">{t("admin:budget.balance", "יתרת חוב")}</p>
						<p className={`text-xl font-bold ${account.balance > 0 ? "text-red-600" : "text-green-600"}`}>
							<Price price={account.balance} />
						</p>
					</div>
				</div>
			)}

			{/* Filters + actions */}
			<div className="flex items-center gap-3 flex-wrap">
				{billingAccounts.length > 0 && (
					<Select
						size="sm"
						placeholder="סנן לפי חשבון חיוב"
						className="w-56"
						selectedKeys={billingAccountFilter ? [billingAccountFilter] : []}
						onSelectionChange={(keys) => setBillingAccountFilter(([...keys][0] as string) ?? "")}
					>
						{[
							<SelectItem key="" textValue="הכל">הכל</SelectItem>,
							...billingAccounts.map((ba) => (
								<SelectItem key={ba.id} textValue={ba.name}>
									{ba.name} ({ba.number})
								</SelectItem>
							)),
						]}
					</Select>
				)}
				<Button
					size="sm"
					variant="bordered"
					onPress={() => setManualModal(true)}
				>
					<Icon icon="lucide:plus" className="mr-1" />
					{t("admin:budget.addManual", "הוסף תנועה ידנית")}
				</Button>
			</div>

			{/* Transaction ledger */}
			{loading ? (
				<div className="flex items-center justify-center h-40">
					<Spinner />
				</div>
			) : (
				<Table aria-label="budget transactions">
					<TableHeader>
						<TableColumn>{t("common:date", "תאריך")}</TableColumn>
						<TableColumn>{t("admin:budget.txType", "סוג תנועה")}</TableColumn>
						<TableColumn>{t("admin:budget.amount", "סכום")}</TableColumn>
						<TableColumn>{t("admin:budget.runningBalance", "יתרה")}</TableColumn>
						<TableColumn>{t("admin:budget.document", "מסמך")}</TableColumn>
						<TableColumn>{t("admin:budget.billingAccount", "חשבון חיוב")}</TableColumn>
						<TableColumn>{t("admin:budget.paymentDetails", "פרטי תשלום")}</TableColumn>
						<TableColumn>{t("common:note", "הערה")}</TableColumn>
					</TableHeader>
					<TableBody emptyContent={t("admin:budget.noTransactions", "אין תנועות")}>
						{transactions.filter((tx) => VISIBLE_TX_TYPES.includes(tx.type)).map((tx) => (
							<TableRow key={tx.id}>
								<TableCell>
									<DateView date={tx.createdAt} />
								</TableCell>
								<TableCell>
									<Chip size="sm" color={txColor(tx.type)} variant="flat">
										{TX_TYPE_LABELS[tx.type]}
									</Chip>
								</TableCell>
								<TableCell>
									<span className={tx.debt > 0 ? "text-red-600" : "text-green-600"}>
										{tx.debt > 0 ? "+" : ""}
										<Price price={tx.debt} />
									</span>
								</TableCell>
								<TableCell>
									<Price price={tx.runningBalance} />
								</TableCell>
								<TableCell>
									{tx.type === "delivery_note" && tx.deliveryNoteNumber ? (
										<span className="font-mono text-sm">{tx.deliveryNoteNumber}</span>
									) : tx.orderId ? (
										<Button
											size="sm"
											variant="light"
											onPress={() => navigate({ to: "admin.order", params: { id: tx.orderId! } })}
										>
											{tx.orderId.slice(0, 8)}…
										</Button>
									) : (
										"—"
									)}
								</TableCell>
								<TableCell>
									{tx.billingAccountName
										? `${tx.billingAccountName} (${tx.billingAccountNumber})`
										: "—"}
								</TableCell>
								<TableCell>
									{tx.type === "payment_received" && tx.paymentMethod ? (
										<span className="text-sm">
											{tx.paymentMethod}
											{tx.paymentReference ? ` · ${tx.paymentReference}` : ""}
										</span>
									) : (
										"—"
									)}
								</TableCell>
								<TableCell>{tx.note ?? "—"}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			{/* Manual transaction modal */}
			<Modal isOpen={manualModal} onClose={() => setManualModal(false)}>
				<ModalContent>
					<ModalHeader>{t("admin:budget.addManual", "הוסף תנועה ידנית")}</ModalHeader>
					<ModalBody className="space-y-4">
						<Select
							label="סוג תנועה"
							selectedKeys={[manualType]}
							onSelectionChange={(keys) =>
								setManualType(([...keys][0] as "credit_note" | "debit_note"))
							}
						>
							<SelectItem key="credit_note" textValue="זיכוי">זיכוי (מקטין חוב)</SelectItem>
							<SelectItem key="debit_note" textValue="חיוב">חיוב (מגדיל חוב)</SelectItem>
						</Select>
						<Input
							label="סכום (₪)"
							type="number"
							min={0.01}
							step={0.01}
							value={manualAmount}
							onValueChange={setManualAmount}
						/>
						<Textarea
							label="הערה"
							placeholder="סיבת הזיכוי / החיוב"
							value={manualNote}
							onValueChange={setManualNote}
						/>
					</ModalBody>
					<ModalFooter>
						<Button variant="light" onPress={() => setManualModal(false)}>
							{t("common:cancel", "ביטול")}
						</Button>
						<Button
							color="primary"
							isLoading={manualLoading}
							isDisabled={!manualAmount || !manualNote.trim()}
							onPress={submitManual}
						>
							{t("common:save", "שמור")}
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	);
}
