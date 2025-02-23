// @ts-nocheck
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
} from "@nextui-org/react";
import { useTranslation } from "react-i18next";

export function capitalize(str?: string) {
	if (!str) return "";
	return str.charAt(0).toUpperCase() + str.slice(1);
}

const INITIAL_VISIBLE_COLUMNS = ["name", "address", "status", "actions"];

const columns = [
	{ name: "NAME", uid: "name", sortable: true },
	{ name: "address", uid: "address", sortable: true },
	{ name: "phone", uid: "phone" },
	{ name: "clientType", uid: "clientType" },
	{ name: "ACTIONS", uid: "actions" },
];

const statusOptions = [
	{ name: "Active", uid: "active" },
	{ name: "Paused", uid: "paused" },
	{ name: "Vacation", uid: "vacation" },
];

function AdminUsersPage() {
	const appApi = useAppApi();

	const { t } = useTranslation(["common", "admin"]);

	const [clients, setClients] = useState<TProfile[]>([]);

	const [filterValue, setFilterValue] = React.useState("");
	const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
	const [visibleColumns, setVisibleColumns] = React.useState(new Set(INITIAL_VISIBLE_COLUMNS));
	const [statusFilter, setStatusFilter] = React.useState("all");
	const [rowsPerPage, setRowsPerPage] = React.useState(5);
	const [sortDescriptor, setSortDescriptor] = React.useState({
		column: "age",
		direction: "ascending",
	});
	const [page, setPage] = React.useState(1);

	const hasSearchFilter = Boolean(filterValue);

	const headerColumns = React.useMemo(() => {
		return columns;
		if (visibleColumns === "all") return columns;

		return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
	}, [visibleColumns]);

	const filteredItems = React.useMemo(() => {
		return clients;
		// let filteredUsers = [...clients];

		// if (hasSearchFilter) {
		// 	filteredUsers = filteredUsers.filter((user) =>
		// 		user.name.toLowerCase().includes(filterValue.toLowerCase())
		// 	);
		// }
		// if (statusFilter !== "all" && Array.from(statusFilter).length !== statusOptions.length) {
		// 	filteredUsers = filteredUsers.filter((user) =>
		// 		Array.from(statusFilter).includes(user.status)
		// 	);
		// }

		// return filteredUsers;
	}, [clients, filterValue, statusFilter]);

	// const pages = Math.ceil(filteredItems.length / rowsPerPage);

	const items = React.useMemo(() => {
		const start = (page - 1) * rowsPerPage;
		const end = start + rowsPerPage;

		return filteredItems.slice(start, end);
	}, [page, filteredItems, rowsPerPage]);

	const sortedItems = React.useMemo(() => {
		return items;

		// return [...items].sort((a, b) => {
		// 	const first = a[sortDescriptor.column];
		// 	const second = b[sortDescriptor.column];
		// 	const cmp = first < second ? -1 : first > second ? 1 : 0;

		// 	return sortDescriptor.direction === "descending" ? -cmp : cmp;
		// });
	}, [sortDescriptor, items]);

	useEffect(() => {
		appApi.admin.getStoreClients().then((res) => {
			if (res?.success) {
				setClients(res.data);
			}
		});
	}, []);

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
								// bottomContent={bottomContent}
								bottomContentPlacement="outside"
								classNames={{
									wrapper: "max-h-[382px]",
								}}
								// selectedKeys={selectedKeys}
								selectionMode="multiple"
								// sortDescriptor={sortDescriptor}
								// topContent={topContent}
								topContentPlacement="outside"
								// onSelectionChange={setSelectedKeys}
								// onSortChange={setSortDescriptor}
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
								<TableBody emptyContent={"No users found"} items={sortedItems}>
									{(user) => (
										<TableRow key={user.id}>
											<TableCell>
												<User
													avatarProps={{ radius: "lg", src: "" }}
													description={user.email}
													name={user.displayName}
												>
													{user.email}
												</User>
											</TableCell>
											<TableCell>
												{user.address.city}, {user.address.street}{" "}
												{user.address.streetNumber}
												<br />
												{t("common:apartmentEnterNumber")} (
												{user.address.apartmentEnterNumber})
												<br />
												{t("apartmentNumber")} {user.address.apartmentNumber},{" "}
												{t("common:floor")} {user.address.floor}
											</TableCell>
											<TableCell>{user.phoneNumber.number}</TableCell>
											<TableCell>{user.clientType}</TableCell>
											<TableCell>
												<div className="relative flex justify-end items-center gap-2">
													<Dropdown>
														<DropdownTrigger>
															<Button isIconOnly size="sm" variant="light">
																<svg
																	className="text-default-300"
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
														<DropdownMenu>
															<DropdownItem>View</DropdownItem>
															<DropdownItem>Edit</DropdownItem>
															<DropdownItem>Delete</DropdownItem>
														</DropdownMenu>
													</Dropdown>
												</div>
											</TableCell>
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
