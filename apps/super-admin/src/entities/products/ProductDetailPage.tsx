import { useParams, Link } from "react-router-dom";
import { useProductDetail } from "./useProductDetail";
import { ProductVisibilityForm } from "./ProductVisibilityForm";
import { ProductStockForm } from "./ProductStockForm";
import { EntityErrorBanner } from "src/entities/shared/EntityErrorBanner";
import { RawJsonPanel } from "src/entities/shared/RawJsonPanel";
import { useStoreContext } from "src/store-context/StoreContext";
import type { TProduct } from "src/lib/saContracts";

function LabelValue({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-0.5">
			<dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
				{label}
			</dt>
			<dd className="text-sm text-slate-800">
				{value ?? <span className="text-slate-400">—</span>}
			</dd>
		</div>
	);
}

function getProductName(product: TProduct): string {
	const first = product.name[0];
	if (!first) return product.sku;
	return first.value ?? product.sku;
}

function ProductFields({ product }: { product: TProduct }) {
	return (
		<div className="space-y-6">
			<section>
				<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
					Product
				</h2>
				<dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
					<LabelValue label="ID" value={<span className="font-mono text-xs">{product.id}</span>} />
					<LabelValue label="SKU" value={<span className="font-mono text-xs">{product.sku}</span>} />
					<LabelValue label="Name" value={getProductName(product)} />
					<LabelValue label="Price" value={product.price} />
					<LabelValue
						label="Published"
						value={
							<span
								className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${product.isPublished ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"}`}
							>
								{product.isPublished ? "Published" : "Hidden"}
							</span>
						}
					/>
				</dl>
			</section>

			{product.stock && (
				<section>
					<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
						Stock
					</h2>
					<dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
						<LabelValue label="Quantity" value={product.stock.quantity} />
						<LabelValue label="Unit" value={product.stock.unit} />
					</dl>
				</section>
			)}
		</div>
	);
}

export function ProductDetailPage() {
	const { id } = useParams<{ id: string }>();
	const { currentStore } = useStoreContext();
	const { state, refetch } = useProductDetail(id ?? "");

	return (
		<div>
			<div className="mb-4">
				<Link to="/products" className="text-sm text-blue-600 hover:text-blue-800">
					← Back to products
				</Link>
			</div>

			<h1 className="text-xl font-bold text-slate-900 mb-6">Product detail</h1>

			{state.status === "loading" && (
				<div className="flex items-center justify-center h-40">
					<div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
				</div>
			)}

			{state.status === "error" && <EntityErrorBanner message={state.message} />}

			{state.status === "success" && currentStore && (
				<div className="bg-white rounded-lg border border-slate-200 p-6 space-y-0">
					<ProductFields product={state.product} />

					{/* E2 / E3 edit forms */}
					<div className="mt-6 pt-6 border-t border-slate-200 space-y-6">
						<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
							Edit product
						</h2>
						<ProductVisibilityForm
							companyId={currentStore.companyId}
							storeId={currentStore.id}
							productId={state.product.id}
							currentValue={state.product.isPublished}
							onSuccess={refetch}
						/>
						{state.product.stock !== undefined && (
							<ProductStockForm
								companyId={currentStore.companyId}
								storeId={currentStore.id}
								productId={state.product.id}
								currentQuantity={state.product.stock.quantity}
								onSuccess={refetch}
							/>
						)}
						{state.product.stock === undefined && (
							<p className="text-xs text-slate-400 italic">
								Stock editing is unavailable — this product has no stock object.
							</p>
						)}
					</div>

					<RawJsonPanel data={state.product} />
				</div>
			)}
		</div>
	);
}
