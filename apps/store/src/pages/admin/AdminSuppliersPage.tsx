import { useEffect, useState, useMemo, useCallback } from "react";
import { Modal, Input, Table, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAppApi } from "src/appApi";
import { TSupplier, TNewSupplier } from "@jsdev_ninja/core";

// ─── Modal ────────────────────────────────────────────────────────────────────

type SupplierModalState = { kind: "closed" } | { kind: "open"; supplier: TSupplier | null };

function emptyForm(): TNewSupplier {
	return { type: "Supplier", name: "", code: "" };
}

function SupplierModal({
	state,
	onClose,
	onSaved,
}: {
	state: SupplierModalState;
	onClose: () => void;
	onSaved: () => Promise<void> | void;
}) {
	const appApi = useAppApi();
	const [form, setForm] = useState<TNewSupplier>(emptyForm());

	useEffect(() => {
		if (state.kind === "open") {
			setForm(
				state.supplier
					? { type: "Supplier", name: state.supplier.name, code: state.supplier.code }
					: emptyForm()
			);
		}
	}, [state]);

	const isOpen = state.kind === "open";
	const supplier = state.kind === "open" ? state.supplier : null;
	const isNew = supplier === null;
	const title = isNew ? "ספק חדש" : `עריכת ספק — ${supplier?.name}`;
	const canSave = form.name.trim().length > 0 && form.code.trim().length > 0;

	function set(field: keyof TNewSupplier, value: string) {
		setForm((prev) => ({ ...prev, [field]: value }));
	}

	async function handleSave() {
		try {
			const result = isNew
				? await appApi.admin.createSupplier(form)
				: await appApi.admin.updateSupplier({ ...(supplier as TSupplier), ...form });
			if (result?.success) {
				await onSaved();
				onClose();
			}
		} catch (error) {
			console.error("Failed to save supplier:", error);
		}
	}

	return (
		<Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
			<Modal.Container>
				<Modal.Dialog className="max-w-[480px] w-full">
					<Modal.Header>
						<Modal.Heading>{title}</Modal.Heading>
					</Modal.Header>

					<Modal.Body>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-1">
								<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
									שם הספק <span className="text-[var(--danger)]">*</span>
								</label>
								<Input
									value={form.name}
									onChange={(e) => set("name", e.target.value)}
									placeholder="שם הספק"
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
									קוד ספק <span className="text-[var(--danger)]">*</span>
								</label>
								<Input
									value={form.code}
									onChange={(e) => set("code", e.target.value)}
									placeholder="קוד"
								/>
							</div>
						</div>
					</Modal.Body>

					<Modal.Footer>
						<Button variant="ghost" onPress={onClose}>
							ביטול
						</Button>
						<Button
							variant="primary"
							onPress={handleSave}
							isDisabled={!canSave}
							isPending={
								appApi.loading["admin.createSupplier"] || appApi.loading["admin.updateSupplier"]
							}
						>
							{isNew ? "צור" : "שמירה"}
						</Button>
					</Modal.Footer>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Backdrop>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const COLUMNS = [
	{ uid: "name", label: "ספק" },
	{ uid: "code", label: "קוד" },
	{ uid: "actions", label: "" },
];

export function AdminSuppliersPage() {
	const appApi = useAppApi();

	const [suppliers, setSuppliers] = useState<TSupplier[]>([]);
	const [search, setSearch] = useState("");
	const [modal, setModal] = useState<SupplierModalState>({ kind: "closed" });

	const loadSuppliers = useCallback(async () => {
		try {
			const result = await appApi.admin.listSuppliers();
			if (result?.success) setSuppliers((result.data || []) as TSupplier[]);
		} catch (error) {
			console.error("Failed to load suppliers:", error);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps -- appApi is stable

	useEffect(() => {
		loadSuppliers();
	}, [loadSuppliers]);

	// REAL delete
	const handleDelete = async (id: string, name: string) => {
		if (window.confirm(`למחוק את הספק "${name}"?`)) {
			try {
				const result = await appApi.admin.deleteSupplier(id);
				if (result?.success) await loadSuppliers();
			} catch (error) {
				console.error("Failed to delete supplier:", error);
			}
		}
	};

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return suppliers;
		return suppliers.filter(
			(s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
		);
	}, [suppliers, search]);

	return (
		<div className="space-y-5">
			{/* Toolbar */}
			<div className="flex items-center justify-between gap-3">
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
						placeholder="חיפוש ספק..."
						type="search"
						aria-label="חיפוש ספק"
						className="ps-7 w-64"
					/>
				</div>

				<Button variant="primary" onPress={() => setModal({ kind: "open", supplier: null })}>
					<Icon icon="lucide:plus" width={14} height={14} />
					ספק חדש
				</Button>
			</div>

			{/* Table */}
			<div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
				<Table variant="secondary">
					<Table.ScrollContainer>
						<Table.Content
							aria-label="Suppliers table"
							className="min-w-[480px] [&>thead>tr]:border-b [&>thead>tr]:border-[var(--border)] [&>tbody>tr]:border-b [&>tbody>tr]:border-[var(--border)] [&>tbody>tr:last-child]:border-0 [&>tbody>tr:hover]:bg-[var(--background)] [&>tbody>tr]:transition-colors"
						>
							<Table.Header>
								{COLUMNS.map((col) => (
									<Table.Column
										key={col.uid}
										isRowHeader={col.uid === "name"}
										className="text-[11px] font-bold uppercase tracking-wide text-[var(--foreground)] py-3"
										style={{ backgroundColor: "var(--default)", borderRadius: 0 }}
									>
										{col.label}
									</Table.Column>
								))}
							</Table.Header>
							<Table.Body>
								{filtered.length === 0 ? (
									<Table.Row>
										<Table.Cell colSpan={COLUMNS.length} className="text-center py-8 text-[var(--muted)]">
											{search ? "לא נמצאו ספקים התואמים לחיפוש" : "אין ספקים להצגה"}
										</Table.Cell>
									</Table.Row>
								) : (
									filtered.map((s) => (
										<Table.Row key={s.id}>
											{/* ספק */}
											<Table.Cell className="py-3">
												<span className="font-semibold text-sm text-[var(--foreground)]">
													{s.name}
												</span>
											</Table.Cell>

											{/* קוד */}
											<Table.Cell className="py-3">
												<span className="text-sm text-[var(--muted)]">{s.code || "—"}</span>
											</Table.Cell>

											{/* Actions */}
											<Table.Cell className="py-3">
												<div className="flex items-center gap-1.5 justify-end">
													{/* Edit — REAL */}
													<button
														type="button"
														onClick={() => setModal({ kind: "open", supplier: s })}
														className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-[var(--border)] text-[var(--foreground)] bg-[var(--surface)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
													>
														<Icon icon="lucide:pencil" width={12} height={12} />
														ערוך
													</button>

													{/* Delete — REAL */}
													<button
														type="button"
														onClick={() => handleDelete(s.id, s.name)}
														className="inline-flex items-center justify-center w-8 h-8 rounded border border-[var(--border)] text-[var(--danger)] bg-[var(--surface)] hover:border-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-colors"
														title="מחק"
														aria-label={`מחק ${s.name}`}
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

			<SupplierModal
				state={modal}
				onClose={() => setModal({ kind: "closed" })}
				onSaved={loadSuppliers}
			/>
		</div>
	);
}
