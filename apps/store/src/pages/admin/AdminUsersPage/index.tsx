import { useEffect, useState, useMemo } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { navigate } from "src/navigation";
import { Table, Modal, Input, Select, ListBox, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { TProfile, TOrganization } from "@jsdev_ninja/core";

// ─── Helpers ────────────────────────────────────────────────────────────────

// createdDate is epoch millis. Guard legacy docs that may have stored seconds.
function formatDate(value?: number): string {
	if (!value) return "—";
	const ms = value < 1e12 ? value * 1000 : value;
	try {
		return new Date(ms).toLocaleDateString("he-IL");
	} catch {
		return "—";
	}
}

// A client may be linked to companies via organizationIds[] (multi) or
// organizationId (single, legacy). Normalize to a deduped id list.
function clientOrgIds(c: TProfile): string[] {
	if (c.organizationIds?.length) return [...new Set(c.organizationIds)];
	if (c.organizationId) return [c.organizationId];
	return [];
}

// ─── Customer Modal (UI-only — no persistence) ───────────────────────────────

type CustomerModalState = { kind: "closed" } | { kind: "open"; client: TProfile | null };

type CustomerForm = { name: string; phone: string; email: string; organizationId: string };

function buildForm(client: TProfile | null): CustomerForm {
	return {
		name: client?.displayName ?? "",
		phone: client?.phoneNumber ?? "",
		email: client?.email ?? "",
		organizationId: client?.organizationId ?? client?.organizationIds?.[0] ?? "",
	};
}

function CustomerModal({
	state,
	organizations,
	onClose,
}: {
	state: CustomerModalState;
	organizations: TOrganization[];
	onClose: () => void;
}) {
	const [form, setForm] = useState<CustomerForm>(buildForm(null));

	useEffect(() => {
		if (state.kind === "open") setForm(buildForm(state.client));
	}, [state]);

	const isOpen = state.kind === "open";
	const client = state.kind === "open" ? state.client : null;
	const isNew = client === null;
	const title = isNew ? "לקוח חדש" : `עריכת לקוח — ${client?.displayName}`;

	function set(field: keyof CustomerForm, value: string) {
		setForm((prev) => ({ ...prev, [field]: value }));
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
			<Modal.Container>
				<Modal.Dialog className="max-w-[560px] w-full">
					<Modal.Header>
						<Modal.Heading>{title}</Modal.Heading>
					</Modal.Header>

					<Modal.Body>
						<div className="grid grid-cols-2 gap-x-4 gap-y-4">
							<div className="flex flex-col gap-1 col-span-2">
								<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
									שם מלא <span className="text-[var(--danger)]">*</span>
								</label>
								<Input
									value={form.name}
									onChange={(e) => set("name", e.target.value)}
									placeholder="שם הלקוח"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
									טלפון
								</label>
								<Input
									value={form.phone}
									onChange={(e) => set("phone", e.target.value)}
									placeholder="טלפון"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
									דוא"ל <span className="text-[var(--danger)]">*</span>
								</label>
								<Input
									type="email"
									value={form.email}
									onChange={(e) => set("email", e.target.value)}
									placeholder="email@example.com"
								/>
							</div>

							<div className="flex flex-col gap-1 col-span-2">
								<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
									חברה
								</label>
								<Select
									selectedKey={form.organizationId || "none"}
									onSelectionChange={(k) => set("organizationId", k === "none" ? "" : (k as string))}
									aria-label="חברה"
								>
									<Select.Trigger>
										<Select.Value />
										<Select.Indicator />
									</Select.Trigger>
									<Select.Popover>
										<ListBox>
											<ListBox.Item id="none" textValue="ללא חברה">
												— ללא חברה —
											</ListBox.Item>
											{organizations.map((org) => (
												<ListBox.Item key={org.id} id={org.id} textValue={org.name}>
													{org.name}
												</ListBox.Item>
											))}
										</ListBox>
									</Select.Popover>
								</Select>
							</div>
						</div>
					</Modal.Body>

					<Modal.Footer>
						<Button variant="ghost" onPress={onClose}>
							ביטול
						</Button>
						{/* UI-only: persistence is not wired yet */}
						<Button variant="primary" onPress={onClose}>
							שמירה
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const COLUMNS = [
	{ uid: "name", label: "שם מלא" },
	{ uid: "company", label: "חברה" },
	{ uid: "phone", label: "טלפון" },
	{ uid: "email", label: 'דוא"ל' },
	{ uid: "addedDate", label: "תאריך הוספה" },
	{ uid: "actions", label: "" },
];

function AdminUsersPage() {
	const { t } = useTranslation(["common", "admin"]);
	const appApi = useAppApi();

	const [clients, setClients] = useState<TProfile[]>([]);
	const [organizations, setOrganizations] = useState<TOrganization[]>([]);
	const [search, setSearch] = useState("");
	const [companyFilter, setCompanyFilter] = useState("all");
	const [modal, setModal] = useState<CustomerModalState>({ kind: "closed" });
	const [deleteTarget, setDeleteTarget] = useState<TProfile | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	async function handleDelete() {
		if (!deleteTarget) return;
		setIsDeleting(true);
		try {
			const result = await appApi.admin.deleteClient(deleteTarget.id);
			if (result?.success) {
				setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
				setDeleteTarget(null);
			} else {
				console.error("Failed to delete client:", result);
			}
		} catch (error) {
			console.error("Error deleting client:", error);
		} finally {
			setIsDeleting(false);
		}
	}

	useEffect(() => {
		appApi.admin.getStoreClients().then((res) => {
			if (res?.success) setClients(res.data);
		});
		appApi.admin.listOrganizations().then((res) => {
			if (res?.success) setOrganizations((res.data || []) as TOrganization[]);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps -- appApi is stable
	}, []);

	const orgNameById = useMemo(() => {
		const map = new Map<string, string>();
		organizations.forEach((o) => map.set(o.id, o.name));
		return map;
	}, [organizations]);

	function companyDisplay(c: TProfile): ReactNode {
		const names = clientOrgIds(c)
			.map((id) => orgNameById.get(id))
			.filter(Boolean) as string[];
		if (names.length === 0) return c.companyName || "—";
		if (names.length === 1) return names[0];
		return (
			<>
				<b>{names[0]}</b>
				<span className="text-[var(--muted)]"> + {names.length - 1} נוספות</span>
			</>
		);
	}

	const filtered = useMemo(() => {
		let list = clients;
		const q = search.trim().toLowerCase();
		if (q) {
			list = list.filter(
				(c) =>
					c.displayName?.toLowerCase().includes(q) ||
					c.email?.toLowerCase().includes(q) ||
					c.id?.toLowerCase().includes(q)
			);
		}
		if (companyFilter !== "all") {
			list = list.filter((c) => clientOrgIds(c).includes(companyFilter));
		}
		return list;
	}, [clients, search, companyFilter]);

	return (
		<div className="space-y-5">
			{/* Toolbar */}
			<div className="flex items-center justify-between gap-3">
				{/* Search + company filter — start side (right in RTL) */}
				<div className="flex items-center gap-2">
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
							placeholder="חיפוש לקוח..."
							type="search"
							aria-label="חיפוש לקוח"
							className="ps-7 w-64"
						/>
					</div>

					<div className="w-52">
						<Select
							selectedKey={companyFilter}
							onSelectionChange={(k) => setCompanyFilter(k as string)}
							aria-label="סינון לפי חברה"
						>
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									<ListBox.Item id="all" textValue="כל החברות">
										כל החברות
									</ListBox.Item>
									{organizations.map((org) => (
										<ListBox.Item key={org.id} id={org.id} textValue={org.name}>
											{org.name}
										</ListBox.Item>
									))}
								</ListBox>
							</Select.Popover>
						</Select>
					</div>
				</div>

				{/* New customer — end side (left in RTL) */}
				<Button variant="primary" onPress={() => setModal({ kind: "open", client: null })}>
					<Icon icon="lucide:plus" width={14} height={14} />
					לקוח חדש
				</Button>
			</div>

			{/* Table */}
			<div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
				<Table variant="secondary">
					<Table.ScrollContainer>
						<Table.Content
							aria-label="Customers table"
							className="min-w-[760px] [&>thead>tr]:border-b [&>thead>tr]:border-[var(--border)] [&>tbody>tr]:border-b [&>tbody>tr]:border-[var(--border)] [&>tbody>tr:last-child]:border-0 [&>tbody>tr:hover]:bg-[var(--background)] [&>tbody>tr]:transition-colors"
						>
							<Table.Header>
								{COLUMNS.map((col) => (
									<Table.Column
										key={col.uid}
										isRowHeader={col.uid === "name"}
										className="text-[11px] font-bold uppercase tracking-wide text-[var(--foreground)] py-3"
										// Override HeroUI's `secondary` column chrome (inline beats its
										// higher-specificity selectors): `--default` is the theme's neutral
										// surface (= design's --bg-2 #eeece4 under Balasi) + borderRadius 0 so
										// the header is a flush strip, not a standalone rounded pill in the card.
										style={{
											backgroundColor: "var(--default)",
											borderRadius: 0,
										}}
									>
										{col.label}
									</Table.Column>
								))}
							</Table.Header>
							<Table.Body>
								{filtered.length === 0 ? (
									<Table.Row>
										<Table.Cell colSpan={COLUMNS.length} className="text-center py-8 text-[var(--muted)]">
											{search || companyFilter !== "all"
												? "לא נמצאו לקוחות התואמים לסינון"
												: "אין לקוחות להצגה"}
										</Table.Cell>
									</Table.Row>
								) : (
									filtered.map((c) => (
										<Table.Row key={c.id}>
											{/* שם מלא */}
											<Table.Cell className="py-3">
												<div>
													<p className="font-semibold text-sm text-[var(--foreground)]">
														{c.displayName}
													</p>
													{c.clientType && (
														<p className="text-xs text-[var(--muted)] mt-0.5">
															{t(`common:clientTypes.${c.clientType}`, {
																defaultValue: c.clientType,
															})}
														</p>
													)}
												</div>
											</Table.Cell>

											{/* חברה */}
											<Table.Cell className="py-3">
												<span className="text-sm text-[var(--foreground)]">
													{companyDisplay(c)}
												</span>
											</Table.Cell>

											{/* טלפון */}
											<Table.Cell className="py-3">
												<span className="text-sm text-[var(--muted)]">
													{c.phoneNumber || "—"}
												</span>
											</Table.Cell>

											{/* דוא"ל */}
											<Table.Cell className="py-3">
												<span className="text-sm text-[var(--muted)]">{c.email || "—"}</span>
											</Table.Cell>

											{/* תאריך הוספה */}
											<Table.Cell className="py-3">
												<span className="text-sm text-[var(--muted)]">
													{formatDate(c.createdDate)}
												</span>
											</Table.Cell>

											{/* Actions */}
											<Table.Cell className="py-3">
												<div className="flex items-center gap-1.5 justify-end">
													{/* Edit → real client profile page */}
													<button
														type="button"
														onClick={() =>
															navigate({ to: "admin.clientProfile", params: { id: c.id } })
														}
														className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
													>
														<Icon icon="lucide:pencil" width={12} height={12} />
														עריכה
													</button>

													{/* Delete */}
													<button
														type="button"
														onClick={() => setDeleteTarget(c)}
														className="inline-flex items-center justify-center w-8 h-8 rounded border border-[var(--border)] text-[var(--danger)] bg-[var(--surface)] hover:border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-colors"
														title="מחק"
														aria-label={`מחק ${c.displayName}`}
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

			<CustomerModal
				state={modal}
				organizations={organizations}
				onClose={() => setModal({ kind: "closed" })}
			/>

			<Modal.Backdrop
				isOpen={deleteTarget !== null}
				onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
			>
				<Modal.Container>
					<Modal.Dialog className="max-w-[440px] w-full">
						<Modal.Header>
							<Modal.Heading>אישור הסרה</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<p>
								האם אתה בטוח שברצונך להסיר את{" "}
								<strong>{deleteTarget?.displayName}</strong>? פעולה זו לא ניתנת לביטול.
							</p>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="ghost" onPress={() => setDeleteTarget(null)}>
								ביטול
							</Button>
							<Button variant="danger" onPress={handleDelete} isPending={isDeleting}>
								הסר לקוח
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}

export default AdminUsersPage;
