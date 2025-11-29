import * as React from "react";
import { TStore } from "@jsdev_ninja/core";

type InvoiceLayoutProps = {
	store: TStore;
	children: React.ReactNode;
};

function formatAddress(address: TStore["address"]): string | undefined {
	if (!address) return undefined;
	const parts: string[] = [];
	if (address.street) {
		const streetParts = [address.street];
		if (address.streetNumber) streetParts.push(address.streetNumber);
		parts.push(streetParts.join(" "));
	}
	if (address.city) parts.push(address.city);
	if (address.country) parts.push(address.country);
	if (address.floor) parts.push(`קומה ${address.floor}`);
	if (address.apartmentNumber) parts.push(`דירה ${address.apartmentNumber}`);
	return parts.length > 0 ? parts.join(", ") : undefined;
}

export function InvoiceLayout({ store, children }: InvoiceLayoutProps) {
	if (!store) {
		return <div>Error: Store data is missing</div>;
	}

	const formattedAddress = formatAddress(store.address);

	return (
		<div
			style={{
				maxWidth: "800px",
				margin: "0 auto",
				fontFamily: "Arial, sans-serif",
				direction: "rtl",
				padding: "20px",
				backgroundColor: "#fff",
				color: "#333",
			}}
		>
			{/* Header with Logo and Company Details */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					marginBottom: "20px",
					paddingBottom: "10px",
					borderBottom: "2px solid #333",
				}}
			>
				{/* Company Details on the right (RTL) */}
				<div style={{ flex: 1 }}>
					{/* Company Name */}
					<div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "5px" }}>
						{store.name || "Store Name"}
					</div>
					{/* Company Number */}
					{store.companyNumber && (
						<div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
							ח.פ: {store.companyNumber}
						</div>
					)}
					{/* Company Address */}
					{formattedAddress && (
						<div style={{ fontSize: "12px", color: "#666" }}>
							<div>{formattedAddress}</div>
						</div>
					)}
				</div>
				{/* Logo on the left (RTL) */}
				{store.logoUrl && (
					<img
						src={store.logoUrl}
						alt="Logo"
						style={{ maxWidth: "150px", maxHeight: "80px", marginLeft: "15px" }}
					/>
				)}
			</div>

			{/* Invoice Content (children) */}
			{children}
		</div>
	);
}
