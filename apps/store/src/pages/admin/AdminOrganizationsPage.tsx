import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { navigate } from "src/navigation";
import {
	Table,
	Modal,
	Input,
	Select,
	ListBox,
	Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { TOrganization, TBillingAccount } from "@jsdev_ninja/core";
import type { TPaymentType } from "@jsdev_ninja/core";

// ─── Helpers ────────────────────────────────────────────────────────────────

function softBg(color: string, pct = 14) {
	return `color-mix(in oklab, ${color} ${pct}%, transparent)`;
}

type BadgePillProps = { color: string; icon?: string; children: React.ReactNode };
function BadgePill({ color, icon, children }: BadgePillProps) {
	return (
		<span
			className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
			style={{ backgroundColor: softBg(color, 16), color }}
		>
			{icon && <Icon icon={icon} width={11} height={11} />}
			{children}
		</span>
	);
}

// Payment type → Hebrew label (matches i18n keys used elsewhere)
const PAYMENT_TYPE_LABEL: Record<TPaymentType, string> = {
	j5: "J5",
	external: "תשלום חיצוני",
	none: "לא מוגדר",
};

function paymentTypeLabel(pt: TPaymentType | undefined): string {
	if (!pt) return "—";
	return PAYMENT_TYPE_LABEL[pt] ?? pt;
}

function formatAddress(org: TOrganization): string {
	const a = org.address;
	if (!a) return "—";
	const parts = [a.street, a.streetNumber, a.city].filter(Boolean);
	return parts.length > 0 ? parts.join(" ") : "—";
}

// ─── Baseline photo areas (mirrors PHOTO_AREAS in balasi admin.js) ───────────

const PHOTO_AREAS = [
	{ id: "fridge", label: "מקרר", icon: "🧊" },
	{ id: "coffee", label: "מדף קפה", icon: "☕" },
	{ id: "snacks", label: "מדף חטיפים", icon: "🥨" },
	{ id: "drinks", label: "מקרר משקאות", icon: "🥤" },
	{ id: "cleaning", label: "ארון ניקיון", icon: "🧼" },
	{ id: "storage", label: "מחסן כללי", icon: "📦" },
	{ id: "kitchen", label: "מטבחון כללי", icon: "🍽️" },
	{ id: "other", label: "אחר", icon: "📷" },
] as const;

type PhotoAreaId = (typeof PHOTO_AREAS)[number]["id"];

// ─── Modal types ─────────────────────────────────────────────────────────────

type CompanyModalState =
	| { kind: "closed" }
	| { kind: "open"; org: TOrganization | null };

type PhotosModalState =
	| { kind: "closed" }
	| { kind: "open"; org: TOrganization };

type LedgerModalState =
	| { kind: "closed" }
	| { kind: "open"; org: TOrganization };

type CompanyTab = "details" | "branches" | "accounts" | "users";

// ─── Sub-components: Company Modal ──────────────────────────────────────────

type CompanyModalFormState = {
	name: string;
	companyNumber: string;
	city: string;
	street: string;
	streetNumber: string;
	paymentType: TPaymentType;
	discountPercentage: string;
	nameOnInvoice: string;
};

function buildFormState(org: TOrganization | null): CompanyModalFormState {
	return {
		name: org?.name ?? "",
		companyNumber: org?.companyNumber ?? "",
		city: org?.address?.city ?? "",
		street: org?.address?.street ?? "",
		streetNumber: org?.address?.streetNumber ?? "",
		paymentType: org?.paymentType ?? "j5",
		discountPercentage: org?.discountPercentage != null ? String(org.discountPercentage) : "",
		nameOnInvoice: org?.nameOnInvoice ?? "",
	};
}

type CompanyModalProps = {
	state: CompanyModalState;
	onClose: () => void;
};

function CompanyModal({ state, onClose }: CompanyModalProps) {
	const [tab, setTab] = useState<CompanyTab>("details");
	const [form, setForm] = useState<CompanyModalFormState>(buildFormState(null));

	// Reset form and tab whenever the modal opens with a new org
	useEffect(() => {
		if (state.kind === "open") {
			setForm(buildFormState(state.org));
			setTab("details");
		}
	}, [state]);

	const isOpen = state.kind === "open";
	const org = state.kind === "open" ? state.org : null;
	const isNew = org === null;
	const title = isNew ? "חברה חדשה" : `עריכת חברה — ${org?.name}`;

	const billingAccounts: TBillingAccount[] = org?.billingAccounts ?? [];

	const TABS: { key: CompanyTab; label: string; badge?: number }[] = [
		{ key: "details", label: "פרטי חברה" },
		{ key: "branches", label: "🏢 סניפים", badge: 0 },
		{ key: "accounts", label: "💳 חשבונות", badge: billingAccounts.length },
		{ key: "users", label: "👥 משתמשים מורשים", badge: 0 },
	];

	function handleFieldChange(field: keyof CompanyModalFormState, value: string) {
		setForm((prev) => ({ ...prev, [field]: value }));
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
			<Modal.Container>
				<Modal.Dialog className="max-w-[780px] w-full">
					<Modal.Header>
						<Modal.Heading>{title}</Modal.Heading>
					</Modal.Header>

					{/* Tabs — only for edit mode */}
					{!isNew && (
						<div className="flex items-center gap-1 border-b border-[var(--border)] px-5">
							{TABS.map((tabDef) => {
								const active = tab === tabDef.key;
								return (
									<button
										key={tabDef.key}
										type="button"
										onClick={() => setTab(tabDef.key)}
										className={[
											"flex items-center gap-1.5 px-3 py-2.5 -mb-px text-sm font-semibold border-b-2 transition-colors",
											active
												? "border-[var(--accent)] text-[var(--accent)]"
												: "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
										].join(" ")}
									>
										{tabDef.label}
										{tabDef.badge != null && (
											<span
												className="min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full text-[10px] font-bold"
												style={
													active
														? { backgroundColor: softBg("var(--accent)"), color: "var(--accent)" }
														: { backgroundColor: "var(--default)", color: "var(--muted)" }
												}
											>
												{tabDef.badge}
											</span>
										)}
									</button>
								);
							})}
						</div>
					)}

					<Modal.Body>
						{/* ── Details Tab ── */}
						{(isNew || tab === "details") && (
							<div className="grid grid-cols-2 gap-x-4 gap-y-4">
								<div className="flex flex-col gap-1 col-span-2">
									<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
										שם החברה <span className="text-[var(--danger)]">*</span>
									</label>
									<Input
										value={form.name}
										onChange={(e) => handleFieldChange("name", e.target.value)}
										placeholder="שם החברה"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
										ח.פ
									</label>
									<Input
										value={form.companyNumber}
										onChange={(e) => handleFieldChange("companyNumber", e.target.value)}
										placeholder="מספר חברה"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
										עיר
									</label>
									<Input
										value={form.city}
										onChange={(e) => handleFieldChange("city", e.target.value)}
										placeholder="עיר"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
										רחוב
									</label>
									<Input
										value={form.street}
										onChange={(e) => handleFieldChange("street", e.target.value)}
										placeholder="רחוב"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
										מספר
									</label>
									<Input
										value={form.streetNumber}
										onChange={(e) => handleFieldChange("streetNumber", e.target.value)}
										placeholder="מספר"
									/>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
										תנאי תשלום
									</label>
									<Select
										selectedKey={form.paymentType}
										onSelectionChange={(k) => handleFieldChange("paymentType", k as string)}
										aria-label="תנאי תשלום"
									>
										<Select.Trigger>
											<Select.Value />
											<Select.Indicator />
										</Select.Trigger>
										<Select.Popover>
											<ListBox>
												<ListBox.Item id="j5" textValue="J5">J5</ListBox.Item>
												<ListBox.Item id="external" textValue="תשלום חיצוני">תשלום חיצוני</ListBox.Item>
												<ListBox.Item id="none" textValue="לא מוגדר">לא מוגדר</ListBox.Item>
											</ListBox>
										</Select.Popover>
									</Select>
								</div>
								<div className="flex flex-col gap-1">
									<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
										% הנחה
									</label>
									<Input
										type="number"
										value={form.discountPercentage}
										onChange={(e) => handleFieldChange("discountPercentage", e.target.value)}
										placeholder="0"
										min="0"
										max="100"
									/>
								</div>
								<div className="flex flex-col gap-1 col-span-2">
									<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
										שם בחשבונית
									</label>
									<Input
										value={form.nameOnInvoice}
										onChange={(e) => handleFieldChange("nameOnInvoice", e.target.value)}
										placeholder="שם כפי שיופיע בחשבונית"
									/>
								</div>
							</div>
						)}

						{/* ── Branches Tab — no data, empty state ── */}
						{!isNew && tab === "branches" && (
							<div className="flex flex-col gap-4">
								<div
									className="flex items-start gap-3 p-3 rounded-lg text-sm"
									style={{ backgroundColor: softBg("var(--info)", 12), color: "var(--foreground)" }}
								>
									<span className="text-xl mt-0.5">🏢</span>
									<p>
										<b>סניפים</b> — חברה יכולה לכלול כמה משרדים פיזיים, כל סניף עם כתובת וטלפון משלו.
									</p>
								</div>
								<div className="py-8 text-center text-[var(--muted)]">
									<p className="text-4xl mb-3">🏢</p>
									<p className="font-semibold">אין סניפים מוגדרים</p>
									<p className="text-sm mt-1">הוספת סניפים תהיה זמינה בעתיד</p>
								</div>
							</div>
						)}

						{/* ── Accounts Tab — show real billing accounts ── */}
						{!isNew && tab === "accounts" && (
							<div className="flex flex-col gap-4">
								<div
									className="flex items-start gap-3 p-3 rounded-lg text-sm"
									style={{ backgroundColor: softBg("var(--info)", 12), color: "var(--foreground)" }}
								>
									<span className="text-xl mt-0.5">💳</span>
									<p>
										<b>חשבונות (מספרי לקוח)</b> — חשבונות הלקוח המשמשים לחיוב.
									</p>
								</div>
								{billingAccounts.length === 0 ? (
									<div className="py-8 text-center text-[var(--muted)]">
										<p className="text-4xl mb-3">💳</p>
										<p className="font-semibold">אין חשבונות</p>
									</div>
								) : (
									<div className="flex flex-col gap-2">
										{billingAccounts.map((account) => (
											<div
												key={account.id}
												className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--background)]"
											>
												<div
													className="w-9 h-9 rounded-full grid place-items-center text-lg flex-shrink-0"
													style={{ backgroundColor: softBg("var(--info)", 16) }}
												>
													💳
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-semibold text-sm text-[var(--foreground)]">
														{account.name}
													</p>
													<p className="text-xs text-[var(--muted)] mt-0.5">
														{account.number}
													</p>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{/* ── Users Tab — no data, empty state ── */}
						{!isNew && tab === "users" && (
							<div className="flex flex-col gap-4">
								<div
									className="flex items-start gap-3 p-3 rounded-lg text-sm"
									style={{ backgroundColor: softBg("var(--info)", 12), color: "var(--foreground)" }}
								>
									<span className="text-xl mt-0.5">👥</span>
									<p>
										<b>משתמשים מורשים</b> — אנשי הקשר שמורשים לבצע הזמנות עבור החברה.
									</p>
								</div>
								<div className="py-8 text-center text-[var(--muted)]">
									<p className="text-4xl mb-3">👥</p>
									<p className="font-semibold">אין משתמשים מורשים</p>
									<p className="text-sm mt-1">ניהול משתמשים מורשים יהיה זמין בעתיד</p>
								</div>
							</div>
						)}
					</Modal.Body>

					<Modal.Footer>
						<Button variant="ghost" onPress={onClose}>
							סגירה
						</Button>
						{/* Save is UI-only: closes the modal, no backend call */}
						<Button variant="primary" onPress={onClose}>
							{isNew ? "שמור" : "שמור פרטים"}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

// ─── Sub-component: Baseline Photos Modal ────────────────────────────────────

type BaselinePhotosModalProps = {
	state: PhotosModalState;
	onClose: () => void;
};

function BaselinePhotosModal({ state, onClose }: BaselinePhotosModalProps) {
	const [selectedArea, setSelectedArea] = useState<PhotoAreaId>("fridge");
	const isOpen = state.kind === "open";
	const org = state.kind === "open" ? state.org : null;

	useEffect(() => {
		if (state.kind === "open") setSelectedArea("fridge");
	}, [state]);

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
			<Modal.Container>
				<Modal.Dialog className="max-w-[780px] w-full">
					<Modal.Header>
						<Modal.Heading>תמונות Baseline — {org?.name}</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-5">
							{/* Info banner */}
							<div
								className="flex items-start gap-3 p-3 rounded-lg text-sm"
								style={{ backgroundColor: softBg("var(--info)", 12), color: "var(--foreground)" }}
							>
								<span className="text-xl mt-0.5">💡</span>
								<div>
									<b>כיצד זה עובד?</b>
									<p className="mt-1 text-[var(--muted)]">
										כשהלקוח מבצע הזמנה ראשונה, צלמו את המדפים שלו במצב מלא. בהזמנות הבאות
										הלקוח יצלם את אותם מדפים, ה-AI ישווה ויזהה אוטומטית מה חסר.
										<b> מומלץ:</b> 3-5 תמונות בזוויות שונות.
									</p>
								</div>
							</div>

							{/* Upload form — UI only */}
							<div className="grid grid-cols-[180px_1fr] gap-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--background)]">
								{/* File drop area */}
								<label
									className="flex flex-col items-center justify-center gap-2 h-36 rounded-lg border-2 border-dashed border-[var(--border)] text-[var(--muted)] cursor-pointer hover:border-[var(--accent)] transition-colors"
									aria-label="בחרו תמונה"
								>
									<input type="file" accept="image/*" className="sr-only" disabled />
									<Icon icon="lucide:image" width={28} height={28} />
									<span className="text-xs text-center">בחרו תמונה</span>
								</label>

								{/* Form fields */}
								<div className="flex flex-col gap-3">
									<div className="flex flex-col gap-1">
										<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
											אזור בתמונה
										</label>
										<Select
											selectedKey={selectedArea}
											onSelectionChange={(k) => setSelectedArea(k as PhotoAreaId)}
											aria-label="אזור בתמונה"
										>
											<Select.Trigger>
												<Select.Value />
												<Select.Indicator />
											</Select.Trigger>
											<Select.Popover>
												<ListBox>
													{PHOTO_AREAS.map((area) => (
														<ListBox.Item key={area.id} id={area.id} textValue={area.label}>
															{area.icon} {area.label}
														</ListBox.Item>
													))}
												</ListBox>
											</Select.Popover>
										</Select>
									</div>
									<div className="flex flex-col gap-1">
										<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
											תווית
										</label>
										<Input placeholder="לדוגמה: מקרר ראשי - מצב מלא" disabled />
									</div>
									<div className="flex flex-col gap-1">
										<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
											הערות
										</label>
										<Input placeholder="פרטים נוספים על מצב המדף" disabled />
									</div>
								</div>
							</div>

							{/* Photos grid — empty state */}
							<div>
								<div className="flex items-center justify-between mb-3">
									<h4 className="text-sm font-semibold text-[var(--foreground)]">
										0 תמונות בסיס נוכחיות
									</h4>
								</div>
								<div className="py-10 text-center text-[var(--muted)]">
									<p className="text-5xl mb-3">📷</p>
									<p className="font-semibold">אין עדיין תמונות בסיס</p>
									<p className="text-sm mt-1">
										העלו תמונות של מדפי הלקוח במצב מלא — אלה ישמשו את ה-AI להשוואה.
									</p>
								</div>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="ghost" onPress={onClose}>
							סגירה
						</Button>
						{/* Upload is UI-only — no-op */}
						<Button variant="primary" isDisabled>
							<Icon icon="lucide:plus" width={14} height={14} />
							הוסף תמונה ל-Baseline
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

// ─── Sub-component: Ledger Modal ──────────────────────────────────────────────

type LedgerTab = "all" | "dn" | "inv" | "rcp" | "crd";

const LEDGER_TABS: { key: LedgerTab; label: string }[] = [
	{ key: "all", label: "הכל" },
	{ key: "dn", label: "תעודות משלוח (0)" },
	{ key: "inv", label: "חשבוניות (0)" },
	{ key: "rcp", label: "קבלות (0)" },
	{ key: "crd", label: "זיכויים (0)" },
];

type LedgerModalProps = {
	state: LedgerModalState;
	onClose: () => void;
};

function LedgerModal({ state, onClose }: LedgerModalProps) {
	const [ledgerTab, setLedgerTab] = useState<LedgerTab>("all");
	const isOpen = state.kind === "open";
	const org = state.kind === "open" ? state.org : null;

	useEffect(() => {
		if (state.kind === "open") setLedgerTab("all");
	}, [state]);

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
			<Modal.Container>
				<Modal.Dialog className="max-w-[900px] w-full">
					<Modal.Header>
						<Modal.Heading>כרטסת לקוח — {org?.name}</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<div className="flex flex-col gap-4">
							{/* Customer header strip */}
							<div
								className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-[var(--border)]"
								style={{ backgroundColor: softBg("var(--background)", 100) }}
							>
								<div className="flex flex-col gap-2 text-sm">
									<div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
										<span className="text-[var(--muted)]">מספר לקוח</span>
										<b className="text-[var(--foreground)]">—</b>
										<span className="text-[var(--muted)]">ח.פ</span>
										<b className="text-[var(--foreground)]">
											{org?.companyNumber ?? "—"}
										</b>
										<span className="text-[var(--muted)]">תנאי תשלום</span>
										<b className="text-[var(--foreground)]">
											{paymentTypeLabel(org?.paymentType)}
										</b>
										<span className="text-[var(--muted)] col-span-2">כתובת</span>
										<b className="text-[var(--foreground)] col-span-2">
											{org ? formatAddress(org) : "—"}
										</b>
									</div>
								</div>
								<div
									className="flex flex-col gap-1.5 p-3 rounded-lg text-sm border border-[var(--border)]"
									style={{ backgroundColor: "var(--surface)" }}
								>
									<div className="flex justify-between">
										<span className="text-[var(--muted)]">סך חשבוניות</span>
										<b>—</b>
									</div>
									<div className="flex justify-between">
										<span className="text-[var(--muted)]">סך תשלומים</span>
										<b>—</b>
									</div>
									<div
										className="flex justify-between pt-1.5 mt-1 border-t border-[var(--border)] font-bold"
									>
										<span>יתרה לתשלום</span>
										<b className="text-[var(--muted)]">—</b>
									</div>
								</div>
							</div>

							{/* Type tabs */}
							<div className="flex items-center gap-1 border-b border-[var(--border)]">
								{LEDGER_TABS.map((tabDef) => {
									const active = ledgerTab === tabDef.key;
									return (
										<button
											key={tabDef.key}
											type="button"
											onClick={() => setLedgerTab(tabDef.key)}
											className={[
												"px-3 py-2 -mb-px text-sm font-semibold border-b-2 transition-colors",
												active
													? "border-[var(--accent)] text-[var(--accent)]"
													: "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
											].join(" ")}
										>
											{tabDef.label}
										</button>
									);
								})}
							</div>

							{/* Ledger entries — empty state */}
							<div className="py-10 text-center text-[var(--muted)]">
								<p className="text-5xl mb-3">📒</p>
								<p className="font-semibold">אין תנועות להצגה</p>
								<p className="text-sm mt-1">לא נמצאו תנועות בקטגוריה זו</p>
							</div>
						</div>
					</Modal.Body>
					<Modal.Footer>
						<Button variant="ghost" onPress={onClose}>
							סגירה
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const COLUMNS = [
	{ uid: "name", label: "שם חברה" },
	{ uid: "taxId", label: "ח.פ" },
	{ uid: "city", label: "עיר" },
	{ uid: "address", label: "כתובת" },
	{ uid: "contacts", label: "אנשי קשר" },
	{ uid: "payTerms", label: "תנאי תשלום" },
	{ uid: "debt", label: "חוב פתוח" },
	{ uid: "actions", label: "" },
];

export function AdminOrganizationsPage() {
	const { t } = useTranslation(["common", "admin"]);
	const appApi = useAppApi();

	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [search, setSearch] = useState("");

	// Modal state
	const [companyModal, setCompanyModal] = useState<CompanyModalState>({ kind: "closed" });
	const [photosModal, setPhotosModal] = useState<PhotosModalState>({ kind: "closed" });
	const [ledgerModal, setLedgerModal] = useState<LedgerModalState>({ kind: "closed" });

	const loadOrganizations = useCallback(async () => {
		try {
			const result = await appApi.admin.listOrganizations();
			if (result?.success) {
				setOrganizations((result.data || []) as TOrganization[]);
			}
		} catch (error) {
			console.error("Failed to load organizations:", error);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		loadOrganizations();
	}, [loadOrganizations]);

	// REAL delete — preserved from original implementation
	const handleDelete = async (organizationId: string) => {
		if (window.confirm(t("admin:organizationsPage.confirmDelete"))) {
			try {
				const result = await appApi.admin.deleteOrganization(organizationId);
				if (result?.success) {
					await loadOrganizations();
				}
			} catch (error) {
				console.error("Failed to delete organization:", error);
			}
		}
	};

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return organizations;
		return organizations.filter(
			(org) =>
				org.name.toLowerCase().includes(q) ||
				(org.companyNumber ?? "").toLowerCase().includes(q)
		);
	}, [organizations, search]);

	return (
		<div className="space-y-5">
			{/* Toolbar */}
			<div className="flex items-center justify-between gap-3">
				{/* Search — left side in RTL = start */}
				<div className="relative">
					<Icon
						icon="lucide:search"
						className="absolute start-2 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
						width={16}
						height={16}
					/>
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="חיפוש חברה..."
						type="search"
						aria-label="חיפוש חברה"
						className="ps-7 w-64"
					/>
				</div>

				{/* New company button — right side in RTL = end */}
				<Button
					variant="primary"
					onPress={() => setCompanyModal({ kind: "open", org: null })}
				>
					<Icon icon="lucide:plus" width={14} height={14} />
					חברה חדשה
				</Button>
			</div>

			{/* Table */}
			<div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
				<Table variant="secondary">
					<Table.ScrollContainer>
						<Table.Content
							aria-label="Organizations table"
							className="min-w-[1000px] [&>thead>tr]:border-b [&>thead>tr]:border-[var(--border)] [&>tbody>tr]:border-b [&>tbody>tr]:border-[var(--border)] [&>tbody>tr:last-child]:border-0 [&>tbody>tr:hover]:bg-[var(--background)] [&>tbody>tr]:transition-colors"
						>
							<Table.Header>
								{COLUMNS.map((col) => (
									<Table.Column
										key={col.uid}
										isRowHeader={col.uid === "name"}
										className="bg-[var(--background)] text-[11px] font-bold uppercase tracking-wide text-[var(--muted)] py-3"
									>
										{col.label}
									</Table.Column>
								))}
							</Table.Header>
							<Table.Body>
								{filtered.length === 0 ? (
									<Table.Row>
										<Table.Cell colSpan={COLUMNS.length} className="text-center py-8 text-[var(--muted)]">
											{search ? "לא נמצאו חברות התואמות לחיפוש" : "אין חברות להצגה"}
										</Table.Cell>
									</Table.Row>
								) : (
									filtered.map((org) => (
										<Table.Row key={org.id}>
											{/* שם חברה */}
											<Table.Cell className="py-3">
												<div>
													<p className="font-semibold text-sm text-[var(--foreground)]">
														{org.name}
														{org.companyNumber && (
															<span className="font-normal text-[var(--muted)] ms-1.5">
																{org.companyNumber}
															</span>
														)}
													</p>
													{org.billingAccounts?.length > 1 && (
														<div className="mt-1">
															<BadgePill color="var(--warning)">
																💳 {org.billingAccounts.length} חשבונות
															</BadgePill>
														</div>
													)}
												</div>
											</Table.Cell>

											{/* ח.פ */}
											<Table.Cell className="py-3">
												<span className="text-sm text-[var(--muted)]">
													{org.companyNumber ?? "—"}
												</span>
											</Table.Cell>

											{/* עיר */}
											<Table.Cell className="py-3">
												<span className="text-sm text-[var(--foreground)]">
													{org.address?.city ?? "—"}
												</span>
											</Table.Cell>

											{/* כתובת */}
											<Table.Cell className="py-3">
												<span className="text-sm text-[var(--muted)]">
													{formatAddress(org)}
												</span>
											</Table.Cell>

											{/* אנשי קשר — no data */}
											<Table.Cell className="py-3">
												<span className="text-sm text-[var(--muted)]">—</span>
											</Table.Cell>

											{/* תנאי תשלום */}
											<Table.Cell className="py-3">
												<span className="text-sm text-[var(--foreground)]">
													{paymentTypeLabel(org.paymentType)}
												</span>
											</Table.Cell>

											{/* חוב פתוח — no data */}
											<Table.Cell className="py-3">
												<span className="text-sm text-[var(--muted)]">—</span>
											</Table.Cell>

											{/* Actions */}
											<Table.Cell className="py-3">
												<div className="flex items-center gap-1.5 justify-end">
													{/* Ledger */}
													<button
														type="button"
														onClick={() => setLedgerModal({ kind: "open", org })}
														className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
														title="כרטסת"
													>
														<Icon icon="lucide:book-text" width={13} height={13} />
														כרטסת
													</button>

													{/* Baseline photos */}
													<button
														type="button"
														onClick={() => setPhotosModal({ kind: "open", org })}
														className="inline-flex items-center justify-center w-8 h-8 rounded border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--muted)] transition-colors"
														title="תמונות Baseline"
														aria-label="תמונות Baseline"
													>
														<Icon icon="lucide:camera" width={14} height={14} />
													</button>

													{/* Edit */}
													<button
														type="button"
														onClick={() => navigate({ to: "admin.organization", params: { id: org.id } })}
														className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
													>
														<Icon icon="lucide:pencil" width={12} height={12} />
														עריכה
													</button>

													{/* Delete — REAL action */}
													<button
														type="button"
														onClick={() => handleDelete(org.id)}
														className="inline-flex items-center justify-center w-8 h-8 rounded border border-[var(--border)] text-[var(--danger)] bg-[var(--surface)] hover:border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-colors"
														title="מחק"
														aria-label={`מחק ${org.name}`}
													>
														<Icon icon="lucide:x" width={14} height={14} />
													</button>
												</div>
											</Table.Cell>
										</Table.Row>
									))
								)}
							</Table.Body>
						</Table.Content>
					</Table.ScrollContainer>
				</Table>
			</div>

			{/* ── Modals ── */}
			<CompanyModal
				state={companyModal}
				onClose={() => setCompanyModal({ kind: "closed" })}
			/>
			<BaselinePhotosModal
				state={photosModal}
				onClose={() => setPhotosModal({ kind: "closed" })}
			/>
			<LedgerModal
				state={ledgerModal}
				onClose={() => setLedgerModal({ kind: "closed" })}
			/>
		</div>
	);
}
