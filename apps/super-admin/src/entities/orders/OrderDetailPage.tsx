import { useParams, Link } from "react-router-dom";
import { useOrderDetail } from "./useOrderDetail";
import { OrderStatusForm } from "./OrderStatusForm";
import { EntityErrorBanner } from "src/entities/shared/EntityErrorBanner";
import { RawJsonPanel } from "src/entities/shared/RawJsonPanel";
import { useStoreContext } from "src/store-context/StoreContext";
import type { TOrder } from "src/lib/saContracts";

function LabelValue({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-0.5">
			<dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
				{label}
			</dt>
			<dd className="text-sm text-slate-800">{value ?? <span className="text-slate-400">—</span>}</dd>
		</div>
	);
}

function formatDate(epochMs: number | undefined): string {
	if (!epochMs) return "—";
	return new Date(epochMs).toLocaleString("en-IL");
}

function OrderFields({ order }: { order: TOrder }) {
	return (
		<div className="space-y-6">
			{/* Core */}
			<section>
				<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
					Order
				</h2>
				<dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
					<LabelValue label="ID" value={<span className="font-mono text-xs">{order.id}</span>} />
					<LabelValue label="Status" value={order.status} />
					<LabelValue label="Payment status" value={order.paymentStatus} />
					<LabelValue label="Date" value={formatDate(order.date)} />
					<LabelValue label="Delivery date" value={formatDate(order.deliveryDate)} />
					<LabelValue label="Total" value={order.cart.cartTotal} />
				</dl>
			</section>

			{/* Cart items */}
			{order.cart.items.length > 0 && (
				<section>
					<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
						Cart items
					</h2>
					<div className="overflow-x-auto rounded-lg border border-slate-200">
						<table className="w-full text-sm">
							<thead className="bg-slate-50 border-b border-slate-200">
								<tr>
									<th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Product</th>
									<th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Qty</th>
									<th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Price</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{order.cart.items.map((item, i) => (
									<tr key={`${item.product.id}-${i}`}>
										<td className="px-3 py-2 text-slate-700">
											{item.product.sku}
										</td>
										<td className="px-3 py-2 text-right text-slate-600">{item.amount}</td>
										<td className="px-3 py-2 text-right text-slate-600">{item.finalPrice ?? item.originalPrice ?? item.product.price}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			)}

			{/* Customer / address */}
			<section>
				<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
					Customer
				</h2>
				<dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
					<LabelValue label="Name" value={order.client?.displayName ?? order.nameOnInvoice} />
					<LabelValue label="Email" value={order.client?.email ?? order.emailOnInvoice} />
					<LabelValue label="Phone" value={order.client?.phoneNumber ?? order.phoneNumberOnInvoice} />
					{order.address && (
						<LabelValue
							label="Address"
							value={[order.address.city, order.address.street, order.address.streetNumber]
								.filter(Boolean)
								.join(", ")}
						/>
					)}
				</dl>
			</section>

			{/* B2B fields — only when present */}
			{(order.companyName || order.poNumber || order.contact) && (
				<section>
					<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
						B2B details
					</h2>
					<dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
						<LabelValue label="Company" value={order.companyName} />
						<LabelValue label="PO number" value={order.poNumber} />
						{order.contact && (
							<>
								<LabelValue label="Contact name" value={order.contact.fullName} />
								<LabelValue label="Contact role" value={order.contact.role} />
								<LabelValue label="Contact phone" value={order.contact.phone} />
								<LabelValue label="Contact email" value={order.contact.email} />
							</>
						)}
					</dl>
				</section>
			)}

			{/* Audit stamp */}
			{(order.updatedBy || order.updatedAt) && (
				<section>
					<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
						Last update
					</h2>
					<dl className="grid grid-cols-2 gap-4">
						<LabelValue label="Updated by" value={order.updatedBy} />
						<LabelValue label="Updated at" value={formatDate(order.updatedAt)} />
					</dl>
				</section>
			)}
		</div>
	);
}

export function OrderDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { currentStore } = useStoreContext();
	const { state, refetch } = useOrderDetail(id ?? "");

	return (
		<div>
			<div className="mb-4">
				<Link to="/orders" className="text-sm text-blue-600 hover:text-blue-800">
					← Back to orders
				</Link>
			</div>

			<h1 className="text-xl font-bold text-slate-900 mb-6">Order detail</h1>

			{state.status === "loading" && (
				<div className="flex items-center justify-center h-40">
					<div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
				</div>
			)}

			{state.status === "error" && <EntityErrorBanner message={state.message} />}

			{state.status === "success" && currentStore && (
				<div className="bg-white rounded-lg border border-slate-200 p-6">
					<OrderFields order={state.order} />
					<OrderStatusForm
						companyId={currentStore.companyId}
						storeId={currentStore.id}
						orderId={state.order.id}
						currentStatus={state.order.status}
						onSuccess={refetch}
					/>
					<RawJsonPanel data={state.order} />
				</div>
			)}
		</div>
	);
}
