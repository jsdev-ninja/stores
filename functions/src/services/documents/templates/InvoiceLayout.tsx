import * as React from "react";

export type CompanyDetails = {
	name: string;
	address?: string;
	phone?: string;
	email?: string;
	website?: string;
	taxId?: string;
	registrationNumber?: string;
	[key: string]: string | undefined;
};

type InvoiceLayoutProps = {
	logoUrl?: string;
	companyDetails: CompanyDetails;
	children: React.ReactNode;
};

export function InvoiceLayout({ logoUrl, companyDetails, children }: InvoiceLayoutProps) {
	return (
		<div
			style={{
				maxWidth: "800px",
				margin: "0 auto",
				fontFamily: "Arial, sans-serif",
				direction: "rtl",
				padding: "40px",
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
					marginBottom: "40px",
					paddingBottom: "20px",
					borderBottom: "2px solid #333",
				}}
			>
				<div style={{ flex: 1 }}>
					<div style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}>
						{companyDetails.name}
					</div>
					{logoUrl && (
						<img
							src={logoUrl}
							alt="Logo"
							style={{ maxWidth: "150px", maxHeight: "80px", marginBottom: "10px" }}
						/>
					)}
					{/* Optional Company Details */}
					{(companyDetails.address ||
						companyDetails.phone ||
						companyDetails.email ||
						companyDetails.website ||
						companyDetails.taxId ||
						companyDetails.registrationNumber) && (
						<div style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
							{companyDetails.address && <div>{companyDetails.address}</div>}
							{companyDetails.phone && <div>טלפון: {companyDetails.phone}</div>}
							{companyDetails.email && <div>אימייל: {companyDetails.email}</div>}
							{companyDetails.website && <div>אתר: {companyDetails.website}</div>}
							{companyDetails.taxId && <div>ח.פ: {companyDetails.taxId}</div>}
							{companyDetails.registrationNumber && (
								<div>מספר רישום: {companyDetails.registrationNumber}</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Invoice Content (children) */}
			{children}
		</div>
	);
}
