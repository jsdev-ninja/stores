import React, { useEffect, useState } from "react";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { modalApi } from "src/infra/modals";
import { TProfile } from "@jsdev_ninja/core";

import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	DropdownTrigger,
	Dropdown,
	DropdownMenu,
	DropdownItem,
	User,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { navigate } from "src/navigation";

export function capitalize(str?: string) {
	if (!str) return "";
	return str.charAt(0).toUpperCase() + str.slice(1);
}

const INITIAL_VISIBLE_COLUMNS = [
	"name",
	"address",
	"phone",
	"clientType",
	"paymentType",
	"actions",
];

const getColumns = (t: any) => [
	{ name: t("admin:clientsPage.columns.name"), uid: "name", sortable: true },
	{ name: t("admin:clientsPage.columns.address"), uid: "address", sortable: true },
	{ name: t("admin:clientsPage.columns.phone"), uid: "phone" },
	{ name: t("admin:clientsPage.columns.clientType"), uid: "clientType" },
	{ name: t("admin:clientsPage.columns.paymentType"), uid: "paymentType" },
	{ name: t("admin:clientsPage.columns.actions"), uid: "actions" },
];

function AdminUsersPage() {
	const appApi = useAppApi();
	const { t } = useTranslation(["common", "admin"]);
	const [clients, setClients] = useState<TProfile[]>([]);
	const [filterValue] = React.useState("");
	const [rowsPerPage] = React.useState(10);
	const [page] = React.useState(1);

	const headerColumns = React.useMemo(() => {
		const columns = getColumns(t);
		return columns.filter((column) => INITIAL_VISIBLE_COLUMNS.includes(column.uid));
	}, [t]);

	const filteredItems = React.useMemo(() => {
		let filteredUsers = [...clients];

		if (filterValue) {
			filteredUsers = filteredUsers.filter(
				(user) =>
					user.displayName?.toLowerCase().includes(filterValue.toLowerCase()) ||
					user.email?.toLowerCase().includes(filterValue.toLowerCase())
			);
		}

		return filteredUsers;
	}, [clients, filterValue]);

	const items = React.useMemo(() => {
		const start = (page - 1) * rowsPerPage;
		const end = start + rowsPerPage;
		return filteredItems.slice(start, end);
	}, [page, filteredItems, rowsPerPage]);

	useEffect(() => {
		appApi.admin.getStoreClients().then((res) => {
			if (res?.success) {
				setClients(res.data);
			}
		});
	}, []);

	const renderCell = React.useCallback(
		(user: TProfile | undefined, columnKey: React.Key) => {
			if (!user) return null;
			switch (columnKey) {
				case "name":
					return (
						<User
							avatarProps={{ radius: "lg", src: "" }}
							description={user.email}
							name={user.displayName}
						>
							{user.email}
						</User>
					);
				case "address":
					return user.address ? (
						<div>
							{user.address.city}, {user.address.street} {user.address.streetNumber}
							<br />
							{user.address.apartmentEnterNumber && (
								<>
									{t("common:apartmentEnterNumber")} ({user.address.apartmentEnterNumber})
									<br />
								</>
							)}
							{user.address.apartmentNumber && (
								<>
									{t("common:apartmentNumber")} {user.address.apartmentNumber}
									{user.address.floor && `, ${t("common:floor")} ${user.address.floor}`}
								</>
							)}
						</div>
					) : (
						t("common:emptyField")
					);
				case "phone":
					return user.phoneNumber || t("common:emptyField");
				case "clientType":
					return user.clientType
						? t(`common:clientTypes.${user.clientType}`)
						: t("common:emptyField");
				case "paymentType":
					return user.paymentType
						? t(`common:paymentTypes.${user.paymentType}`)
						: t("common:emptyField");
				case "actions":
					return (
						<div className="relative flex justify-end items-center gap-2">
							<Dropdown>
								<DropdownTrigger>
									<Button isIconOnly size="sm" variant="light">
										<svg
											className="text-default-500"
											aria-hidden="true"
											fill="none"
											focusable="false"
											height={24}
											role="presentation"
											viewBox="0 0 24 24"
											width={24}
										>
											<path
												d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
												fill="currentColor"
											/>
										</svg>
									</Button>
								</DropdownTrigger>
								<DropdownMenu
									onAction={(key) => {
										if (key === "view") {
											navigate({
												to: "admin.clientProfile",
												params: { id: user.id },
											});
										}
										// Add other actions here as needed
									}}
								>
									<DropdownItem key="view">
										{t("admin:clientsPage.actions.view")}
									</DropdownItem>
									<DropdownItem key="delete" className="text-danger" color="danger">
										{t("admin:clientsPage.actions.delete")}
									</DropdownItem>
								</DropdownMenu>
							</Dropdown>
						</div>
					);
				default:
					return null;
			}
		},
		[t]
	);

	return (
		<>
			{/* Card */}
			<div className="flex flex-col">
				<div className="-m-1.5 overflow-x-auto">
					<div className="p-1.5 min-w-full inline-block align-middle">
						<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
							<div className="px-6 py-4 grid gap-3 md:flex md:justify-between md:items-center border-b border-gray-200 dark:border-neutral-700">
								<div>
									<h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-200">
										{t("admin:clientsPage.title")}
									</h2>
								</div>
								<div>
									<div className="inline-flex gap-x-2">
										<Button onPress={() => modalApi.openModal("AdminCompanyCreateModal")}>
											{t("admin:clientsPage.addClient")}
										</Button>
									</div>
								</div>
							</div>
							<Table
								isHeaderSticky
								bottomContentPlacement="outside"
								classNames={{
									wrapper: "max-h-[500px]",
								}}
								selectionMode="none"
								topContentPlacement="outside"
							>
								<TableHeader columns={headerColumns}>
									{(column) => (
										<TableColumn
											key={column.uid}
											align={column.uid === "actions" ? "center" : "start"}
											allowsSorting={column.sortable}
										>
											{column.name}
										</TableColumn>
									)}
								</TableHeader>
								<TableBody emptyContent={t("admin:clientsPage.noUsersFound")} items={items}>
									{(user) => (
										<TableRow key={user.id}>
											{(columnKey) => (
												<TableCell>{renderCell(user, columnKey)}</TableCell>
											)}
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</div>
				</div>
			</div>
			{/* End Card */}
		</>
	);
}

export default AdminUsersPage;
