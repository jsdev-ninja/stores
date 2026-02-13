import { Checkbox, Input, Button as HeroButton } from "@heroui/react";
import { useState, useEffect } from "react";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { FileDropzone } from "src/components/FileDropzone";
import { useStore } from "src/domains/Store";
import { useTranslation } from "react-i18next";
import { TAddress } from "@jsdev_ninja/core";

function AdminSettingsPage() {
	const [logo, setLogo] = useState<File | null>(null);
	const [deliveryPrice, setDeliveryPrice] = useState<string>("");
	const [freeDeliveryPrice, setFreeDeliveryPrice] = useState<string>("");
	const [minimumOrder, setMinimumOrder] = useState<string>("");
	const [isVatIncludedInPrice, setIsVatIncludedInPrice] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState(false);
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
					onValueChange={setIsVatIncludedInPrice}
				>
					מחירים כוללים מע"מ
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
								color="danger"
								variant="light"
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
						isLoading={isLoading}
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
					<Input
						label={t("common:country")}
						value={address.country || ""}
						onChange={(e) => handleAddressChange("country", e.target.value)}
						placeholder={t("common:country")}
					/>

					<Input
						label={t("common:city")}
						value={address.city || ""}
						onChange={(e) => handleAddressChange("city", e.target.value)}
						placeholder={t("common:city")}
					/>

					<Input
						label={t("common:street")}
						value={address.street || ""}
						onChange={(e) => handleAddressChange("street", e.target.value)}
						placeholder={t("common:street")}
						className="md:col-span-2"
					/>

					<Input
						label={t("common:streetNumber")}
						value={address.streetNumber || ""}
						onChange={(e) => handleAddressChange("streetNumber", e.target.value)}
						placeholder={t("common:streetNumber")}
					/>

					<Input
						label={t("common:apartmentEnterNumber")}
						value={address.apartmentEnterNumber || ""}
						onChange={(e) => handleAddressChange("apartmentEnterNumber", e.target.value)}
						placeholder={t("common:apartmentEnterNumber")}
					/>

					<Input
						label={t("common:floor")}
						value={address.floor || ""}
						onChange={(e) => handleAddressChange("floor", e.target.value)}
						placeholder={t("common:floor")}
					/>

					<Input
						label={t("common:apartmentNumber")}
						value={address.apartmentNumber || ""}
						onChange={(e) => handleAddressChange("apartmentNumber", e.target.value)}
						placeholder={t("common:apartmentNumber")}
					/>
				</div>

				<div className="mt-6">
					<Button 
						onPress={updateDeliverySettings}
						isLoading={isLoading}
						className="w-full md:w-auto"
					>
						{t("common:save")}
					</Button>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex gap-4 justify-center">
							<Button variant="bordered" onPress={() => window.history.back()}>
				{t("common:cancel")}
			</Button>
			</div>
		</div>
	);
}

export default AdminSettingsPage;
