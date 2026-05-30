import React, { useEffect, useState } from "react";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { modalApi } from "src/infra/modals";
import { TProfile } from "@jsdev_ninja/core";

import {
  Table,
  Dropdown,
  Avatar,
  Input,
  Pagination,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const { t, i18n } = useTranslation(["common", "admin"]);
  const isRTL = i18n.dir() === "rtl";
  const [clients, setClients] = useState<TProfile[]>([]);
  const [filterValue, setFilterValue] = React.useState("");
  const [rowsPerPage] = React.useState(10);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [filterValue]);

  const headerColumns = React.useMemo(() => {
    const columns = getColumns(t);
    return columns.filter((column) => INITIAL_VISIBLE_COLUMNS.includes(column.uid));
  }, [t]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...clients];
    const query = filterValue.trim().toLowerCase();
    if (query) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.displayName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.id?.toLowerCase().includes(query)
      );
    }
    return filteredUsers;
  }, [clients, filterValue]);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const topContent = React.useMemo(
    () => (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="relative w-full sm:max-w-[44%]">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="text-gray-400"
                aria-hidden="true"
                fill="none"
                focusable="false"
                height={20}
                role="presentation"
                viewBox="0 0 24 24"
                width={20}
              >
                <path
                  d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 22L20 20"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <Input
              className="w-full pl-9"
              placeholder={t("admin:clientsPage.searchPlaceholder", "Search by name, email or ID")}
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
            {filterValue && (
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setFilterValue("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    ),
    [filterValue, t]
  );

  const bottomContent = React.useMemo(
    () =>
      pages > 1 ? (
        <div className="py-2 px-2 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {t("admin:clientsPage.showing", "Showing {{start}} to {{end}} items", {
              start: filteredItems.length > 0 ? (page - 1) * rowsPerPage + 1 : 0,
              end: Math.min(page * rowsPerPage, filteredItems.length),
            })}
          </span>
          <Pagination aria-label="Pagination" className={isRTL ? "[&_svg]:scale-x-[-1]" : ""}>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  isDisabled={page <= 1}
                >
                  <span className="sr-only">Previous</span>
                  {"<"}
                </Pagination.Previous>
              </Pagination.Item>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Pagination.Item key={p}>
                  <Pagination.Link
                    isActive={p === page}
                    onPress={() => setPage(p)}
                  >
                    {p}
                  </Pagination.Link>
                </Pagination.Item>
              ))}
              <Pagination.Item>
                <Pagination.Next
                  onPress={() => setPage((p) => Math.min(pages, p + 1))}
                  isDisabled={page >= pages}
                >
                  <span className="sr-only">Next</span>
                  {">"}
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </div>
      ) : null,
    [page, pages, filteredItems.length, rowsPerPage, t, isRTL]
  );

  useEffect(() => {
    appApi.admin.getStoreClients().then((res) => {
      if (res?.success) {
        setClients(res.data);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- appApi is stable, do not add to deps
  }, []);

  const renderCell = React.useCallback(
    (user: TProfile | undefined, columnKey: React.Key) => {
      if (!user) return null;
      switch (columnKey) {
        case "name":
          return (
            <div className="inline-flex items-center gap-2">
              <Avatar>
                <Avatar.Image src="" alt={user.displayName ?? ""} />
                <Avatar.Fallback>
                  {user.displayName
                    ? user.displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "?"}
                </Avatar.Fallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.displayName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
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
                <Dropdown.Trigger>
                  <button
                    type="button"
                    className="p-1 rounded-md text-gray-500 hover:text-gray-700"
                    aria-label="Actions"
                  >
                    <svg
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
                  </button>
                </Dropdown.Trigger>
                <Dropdown.Popover>
                  <Dropdown.Menu
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
                    <Dropdown.Item id="view" textValue={t("admin:clientsPage.actions.view")}>
                      {t("admin:clientsPage.actions.view")}
                    </Dropdown.Item>
                    <Dropdown.Item id="delete" textValue={t("admin:clientsPage.actions.delete")}>
                      <span className="text-red-600">{t("admin:clientsPage.actions.delete")}</span>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
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
              {topContent}
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label={t("admin:clientsPage.title")} className="min-w-full">
                    <Table.Header>
                      {headerColumns.map((column) => (
                        <Table.Column
                          key={column.uid}
                          isRowHeader={column.uid === "name"}
                          className={column.uid === "actions" ? "text-center" : "text-start"}
                        >
                          {column.name}
                        </Table.Column>
                      ))}
                    </Table.Header>
                    <Table.Body>
                      {items.length === 0 ? (
                        <Table.Row>
                          <Table.Cell colSpan={headerColumns.length} className="text-center py-8 text-gray-500">
                            {t("admin:clientsPage.noUsersFound")}
                          </Table.Cell>
                        </Table.Row>
                      ) : (
                        items.map((user) => (
                          <Table.Row key={user.id}>
                            {headerColumns.map((column) => (
                              <Table.Cell key={column.uid}>
                                {renderCell(user, column.uid)}
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        ))
                      )}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
              {bottomContent}
            </div>
          </div>
        </div>
      </div>
      {/* End Card */}
    </>
  );
}

export default AdminUsersPage;
