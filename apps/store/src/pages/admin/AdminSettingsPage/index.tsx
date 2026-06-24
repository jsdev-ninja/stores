import { Checkbox, Input, Button as HeroButton } from "@heroui/react";
import { useState, useEffect } from "react";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { FileDropzone } from "src/components/FileDropzone";
import { useStore } from "src/domains/Store";
import { useTranslation } from "react-i18next";
import { TAddress, TProduct } from "@jsdev_ninja/core";

const CHATBOT_CONTEXT_MAX = 3000;
const FEATURED_MAX = 6;

function productLabel(product: TProduct): string {
	return (
		product.name.find((l) => l.lang === "he")?.value ??
		product.name[0]?.value ??
		product.id
	);
}

function AdminSettingsPage() {
	const [logo, setLogo] = useState<File | null>(null);
	const [deliveryPrice, setDeliveryPrice] = useState<string>("");
	const [freeDeliveryPrice, setFreeDeliveryPrice] = useState<string>("");
	const [minimumOrder, setMinimumOrder] = useState<string>("");
	const [isVatIncludedInPrice, setIsVatIncludedInPrice] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState(false);
	const [chatbotContext, setChatbotContext] = useState("");
	const [savedChatbotContext, setSavedChatbotContext] = useState("");
	const [chatbotContextLoading, setChatbotContextLoading] = useState(false);
	const [allProducts, setAllProducts] = useState<TProduct[]>([]);
	const [featuredIds, setFeaturedIds] = useState<string[]>([]);
	const [savedFeaturedIds, setSavedFeaturedIds] = useState<string[]>([]);
	const [featuredSearch, setFeaturedSearch] = useState("");
	const [featuredLoading, setFeaturedLoading] = useState(false);
	const [address, setAddress] = useState<TAddress>({
		country: "",
		city: "",
		street: "",
		streetNumber: "",
		floor: "",
		apartmentEnterNumber: "",
		apartmentNumber: "",
	});

	const store = useStore();
	const appApi = useAppApi();
	const { t } = useTranslation(["common", "deliverySettings"]);

	// Load chatbot config on mount
	useEffect(() => {
		appApi.admin.getChatbotConfig().then((result) => {
			if (result?.success && result.data?.storeContext) {
				setChatbotContext(result.data.storeContext);
				setSavedChatbotContext(result.data.storeContext);
			}
		});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function saveChatbotContext() {
		setChatbotContextLoading(true);
		try {
			await appApi.admin.updateChatbotConfig({ storeContext: chatbotContext });
			setSavedChatbotContext(chatbotContext);
		} catch (error) {
			console.error("Failed to save chatbot context:", error);
		} finally {
			setChatbotContextLoading(false);
		}
	}

	// Load product list + saved featured selection on mount
	useEffect(() => {
		appApi.admin.listProducts().then((result) => {
			if (result?.success) setAllProducts(result.data);
		});
		appApi.admin.getFeaturedProducts().then((result) => {
			if (result?.success && result.data?.productIds) {
				setFeaturedIds(result.data.productIds);
				setSavedFeaturedIds(result.data.productIds);
			}
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const selectedProducts = featuredIds
		.map((id) => allProducts.find((p) => p.id === id))
		.filter((p): p is TProduct => !!p);

	const featuredSearchTrimmed = featuredSearch.trim().toLowerCase();
	const availableProducts = allProducts
		.filter((p) => !featuredIds.includes(p.id))
		.filter(
			(p) =>
				!featuredSearchTrimmed ||
				productLabel(p).toLowerCase().includes(featuredSearchTrimmed),
		)
		.slice(0, 30);

	function addFeatured(id: string) {
		if (featuredIds.length >= FEATURED_MAX || featuredIds.includes(id)) return;
		setFeaturedIds([...featuredIds, id]);
	}

	function removeFeatured(id: string) {
		setFeaturedIds(featuredIds.filter((x) => x !== id));
	}

	function moveFeatured(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= featuredIds.length) return;
		const next = [...featuredIds];
		[next[index], next[target]] = [next[target], next[index]];
		setFeaturedIds(next);
	}

	async function saveFeatured() {
		setFeaturedLoading(true);
		try {
			await appApi.admin.updateFeaturedProducts(featuredIds);
			setSavedFeaturedIds(featuredIds);
		} catch (error) {
			console.error("Failed to save featured products:", error);
		} finally {
			setFeaturedLoading(false);
		}
	}

	const featuredUnchanged =
		JSON.stringify(featuredIds) === JSON.stringify(savedFeaturedIds);

	// Initialize form values when store data loads
	useEffect(() => {
		if (store) {
			setDeliveryPrice(store.deliveryPrice?.toString() || "");
			setFreeDeliveryPrice(store.freeDeliveryPrice?.toString() || "");
			setMinimumOrder(store.minimumOrder?.toString() || "");
			setIsVatIncludedInPrice(store.isVatIncludedInPrice || false);
			setAddress(store.address || {
				country: "",
				city: "",
				street: "",
				streetNumber: "",
				floor: "",
				apartmentEnterNumber: "",
				apartmentNumber: "",
			});
		}
	}, [store]);

	async function uploadLogo() {
		if (!store || !logo) return;
		await appApi.admin.uploadLogo({ logo });
	}

	async function updateDeliverySettings() {
		if (!store) return;

		setIsLoading(true);
		try {
			const settings: {
				deliveryPrice?: number | null;
				freeDeliveryPrice?: number | null;
				minimumOrder?: number | null;
				isVatIncludedInPrice?: boolean;
				address?: TAddress | null;
			} = {
				isVatIncludedInPrice,
			};

			// Handle delivery price - empty string means remove (set to null)
			if (deliveryPrice === "") {
				settings.deliveryPrice = null;
			} else if (deliveryPrice) {
				const price = parseFloat(deliveryPrice);
				if (!isNaN(price) && price >= 0) {
					settings.deliveryPrice = price;
				}
			}

			// Handle free delivery price
			if (freeDeliveryPrice === "") {
				settings.freeDeliveryPrice = null;
			} else if (freeDeliveryPrice) {
				const price = parseFloat(freeDeliveryPrice);
				if (!isNaN(price) && price >= 0) {
					settings.freeDeliveryPrice = price;
				}
			}

			// Handle minimum order
			if (minimumOrder === "") {
				settings.minimumOrder = null;
			} else if (minimumOrder) {
				const amount = parseFloat(minimumOrder);
				if (!isNaN(amount) && amount >= 0) {
					settings.minimumOrder = amount;
				}
			}

			// Handle address - check if address has any non-empty values
			const hasAddressData = Object.values(address).some(value => value && value.trim() !== "");
			if (hasAddressData) {
				// Clean up empty strings
				const cleanAddress: TAddress = {
					country: address.country?.trim() || "",
					city: address.city?.trim() || "",
					street: address.street?.trim() || "",
					streetNumber: address.streetNumber?.trim() || "",
					floor: address.floor?.trim() || "",
					apartmentEnterNumber: address.apartmentEnterNumber?.trim() || "",
					apartmentNumber: address.apartmentNumber?.trim() || "",
				};
				settings.address = cleanAddress;
			} else {
				// If all fields are empty, set to null to remove address
				settings.address = null;
			}

			const result = await appApi.admin.updateStoreSettings(settings);

			if (result?.success) {
				// Show success message or update local state
			}
		} catch (error) {
			console.error("Failed to update delivery settings:", error);
		} finally {
			setIsLoading(false);
		}
	}

	function removeDeliveryPrice() {
		setDeliveryPrice("");
	}

	function handleAddressChange(field: keyof TAddress, value: string) {
		setAddress((prev) => ({
			...prev,
			[field]: value,
		}));
	}

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-8">
			<h1 className="text-3xl font-bold text-center mb-8">{t("common:adminSettings")}</h1>

			{/* Logo Upload Section */}
			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-xl font-semibold mb-4">Upload Logo</h2>
				<FileDropzone
					onChange={(files) => {
						const image = files[0];
						setLogo(image ?? null);
					}}
				/>
				<div className="mt-4">
					<Button isDisabled={!logo} onPress={uploadLogo}>
						{t("common:save")}
					</Button>
				</div>
			</div>

			{/* VAT Settings Section */}
			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-xl font-semibold mb-4">{t("common:vat")}</h2>
				<Checkbox
					isSelected={isVatIncludedInPrice}
					onChange={setIsVatIncludedInPrice}
				>
					<Checkbox.Content>מחירים כוללים מע&quot;מ</Checkbox.Content>
				</Checkbox>
			</div>

			{/* Delivery Settings Section */}
			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-xl font-semibold mb-4">{t("deliverySettings:title")}</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Delivery Price */}
					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-700">
							{t("deliverySettings:deliveryPrice")}
						</label>
						<div className="flex gap-2">
							<Input
								type="number"
								min="0"
								step="0.01"
								value={deliveryPrice}
								onChange={(e) => setDeliveryPrice(e.target.value)}
								placeholder="0.00"
								className="flex-1"
							/>
							<HeroButton
								variant="danger"
								onPress={removeDeliveryPrice}
								isDisabled={!deliveryPrice}
							>
								{t("deliverySettings:removeDeliveryPrice")}
							</HeroButton>
						</div>
						<p className="text-sm text-gray-500">
							{t("deliverySettings:setDeliveryPrice")}
						</p>
					</div>

					{/* Free Delivery Price */}
					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-700">
							{t("deliverySettings:freeDeliveryPrice")}
						</label>
						<Input
							type="number"
							min="0"
							step="0.01"
							value={freeDeliveryPrice}
							onChange={(e) => setFreeDeliveryPrice(e.target.value)}
							placeholder="0.00"
						/>
						<p className="text-sm text-gray-500">
							סכום הזמנה מינימלי לקבלת משלוח חינם
						</p>
					</div>

					{/* Minimum Order */}
					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-700">
							{t("deliverySettings:minimumOrder")}
						</label>
						<Input
							type="number"
							min="0"
							step="0.01"
							value={minimumOrder}
							onChange={(e) => setMinimumOrder(e.target.value)}
							placeholder="0.00"
						/>
						<p className="text-sm text-gray-500">
							סכום הזמנה מינימלי נדרש
						</p>
					</div>
				</div>

				<div className="mt-6">
					<Button
						onPress={updateDeliverySettings}
						isPending={isLoading}
						className="w-full md:w-auto"
					>
						{t("common:save")}
					</Button>
				</div>
			</div>

			{/* Address Section */}
			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-xl font-semibold mb-4">{t("common:address")}</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700">{t("common:country")}</label>
						<Input
							value={address.country || ""}
							onChange={(e) => handleAddressChange("country", e.target.value)}
							placeholder={t("common:country")}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700">{t("common:city")}</label>
						<Input
							value={address.city || ""}
							onChange={(e) => handleAddressChange("city", e.target.value)}
							placeholder={t("common:city")}
						/>
					</div>

					<div className="flex flex-col gap-1 md:col-span-2">
						<label className="text-sm font-medium text-gray-700">{t("common:street")}</label>
						<Input
							value={address.street || ""}
							onChange={(e) => handleAddressChange("street", e.target.value)}
							placeholder={t("common:street")}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700">{t("common:streetNumber")}</label>
						<Input
							value={address.streetNumber || ""}
							onChange={(e) => handleAddressChange("streetNumber", e.target.value)}
							placeholder={t("common:streetNumber")}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700">{t("common:apartmentEnterNumber")}</label>
						<Input
							value={address.apartmentEnterNumber || ""}
							onChange={(e) => handleAddressChange("apartmentEnterNumber", e.target.value)}
							placeholder={t("common:apartmentEnterNumber")}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700">{t("common:floor")}</label>
						<Input
							value={address.floor || ""}
							onChange={(e) => handleAddressChange("floor", e.target.value)}
							placeholder={t("common:floor")}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-sm font-medium text-gray-700">{t("common:apartmentNumber")}</label>
						<Input
							value={address.apartmentNumber || ""}
							onChange={(e) => handleAddressChange("apartmentNumber", e.target.value)}
							placeholder={t("common:apartmentNumber")}
						/>
					</div>
				</div>

				<div className="mt-6">
					<Button
						onPress={updateDeliverySettings}
						isPending={isLoading}
						className="w-full md:w-auto"
					>
						{t("common:save")}
					</Button>
				</div>
			</div>

			{/* Chatbot Context Section */}
			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-xl font-semibold mb-1">הגדרות צ&apos;אטבוט</h2>
				<p className="text-sm text-gray-500 mb-4">
					הוסף מידע על החנות שהבוט ישתמש בו כדי לענות על שאלות לקוחות — שעות פעילות, מדיניות החזרות, אזורי משלוח וכדומה.
				</p>
				<textarea
					value={chatbotContext}
					onChange={(e) => setChatbotContext(e.target.value)}
					rows={8}
					maxLength={CHATBOT_CONTEXT_MAX}
					placeholder="לדוגמה: החנות פתוחה ימים א׳-ה׳ בין 9:00-18:00. משלוח חינם מעל 200 ש״ח. ניתן להחזיר מוצרים תוך 14 יום..."
					className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<div className="flex items-center justify-between mt-2">
					<span className={`text-xs ${chatbotContext.length > CHATBOT_CONTEXT_MAX * 0.9 ? "text-red-500" : "text-gray-400"}`}>
						{chatbotContext.length}/{CHATBOT_CONTEXT_MAX}
					</span>
					<Button
						onPress={saveChatbotContext}
						isPending={chatbotContextLoading}
						isDisabled={
							chatbotContext.length > CHATBOT_CONTEXT_MAX ||
							chatbotContext === savedChatbotContext
						}
					>
						{t("common:save")}
					</Button>
				</div>
			</div>

			{/* Featured Products Section */}
			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-xl font-semibold mb-1">מוצרים נבחרים לעמוד הבית</h2>
				<p className="text-sm text-gray-500 mb-4">
					בחרו עד {FEATURED_MAX} מוצרים שיוצגו בקטע &quot;מבחר השבוע&quot; בעמוד הבית, לפי הסדר שתקבעו.
					אם לא תבחרו מוצרים — יוצגו אוטומטית המוצרים הראשונים בחנות.
				</p>

				{/* Selected products */}
				<div className="mb-5">
					<h3 className="text-sm font-medium text-gray-700 mb-2">
						נבחרו ({selectedProducts.length}/{FEATURED_MAX})
					</h3>
					{selectedProducts.length === 0 ? (
						<p className="text-sm text-gray-400">
							לא נבחרו מוצרים — מוצג מבחר אוטומטי.
						</p>
					) : (
						<ol className="space-y-2">
							{selectedProducts.map((product, index) => (
								<li
									key={product.id}
									className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
								>
									<span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white">
										{index + 1}
									</span>
									<span className="flex-1 text-sm">{productLabel(product)}</span>
									<HeroButton
										size="sm"
										variant="ghost"
										isDisabled={index === 0}
										onPress={() => moveFeatured(index, -1)}
										aria-label="העבר למעלה"
									>
										↑
									</HeroButton>
									<HeroButton
										size="sm"
										variant="ghost"
										isDisabled={index === selectedProducts.length - 1}
										onPress={() => moveFeatured(index, 1)}
										aria-label="העבר למטה"
									>
										↓
									</HeroButton>
									<HeroButton
										size="sm"
										variant="danger"
										onPress={() => removeFeatured(product.id)}
									>
										הסר
									</HeroButton>
								</li>
							))}
						</ol>
					)}
				</div>

				{/* Product picker */}
				<div className="space-y-2">
					<Input
						value={featuredSearch}
						onChange={(e) => setFeaturedSearch(e.target.value)}
						placeholder="חיפוש מוצר לפי שם..."
					/>
					<div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100">
						{availableProducts.length === 0 ? (
							<p className="p-3 text-sm text-gray-400">לא נמצאו מוצרים.</p>
						) : (
							availableProducts.map((product) => (
								<div
									key={product.id}
									className="flex items-center gap-2 px-3 py-2"
								>
									<span className="flex-1 text-sm">{productLabel(product)}</span>
									<HeroButton
										size="sm"
										variant="outline"
										isDisabled={featuredIds.length >= FEATURED_MAX}
										onPress={() => addFeatured(product.id)}
									>
										הוסף
									</HeroButton>
								</div>
							))
						)}
					</div>
					{featuredIds.length >= FEATURED_MAX && (
						<p className="text-xs text-amber-600">
							הגעתם למקסימום {FEATURED_MAX} מוצרים. כדי להוסיף מוצר אחר, הסירו אחד קודם.
						</p>
					)}
				</div>

				<div className="mt-6">
					<Button
						onPress={saveFeatured}
						isPending={featuredLoading}
						isDisabled={featuredUnchanged}
						className="w-full md:w-auto"
					>
						{t("common:save")}
					</Button>
				</div>
			</div>

		{/* Action Buttons */}
			<div className="flex gap-4 justify-center">
						<Button variant="outline" onPress={() => window.history.back()}>
				{t("common:cancel")}
			</Button>
			</div>
		</div>
	);
}

export default AdminSettingsPage;
