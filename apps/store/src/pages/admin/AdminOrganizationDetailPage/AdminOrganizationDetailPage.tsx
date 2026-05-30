import { useEffect, useState } from "react";
import { Button } from "src/components/button";
import {
  Card,
  Modal,
  Select,
  Tabs,
  Table,
  ListBox,
} from "@heroui/react";
import { Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { useParams, navigate } from "src/navigation";
import type { Key } from "react-aria-components";
import {
  TOrganization,
  TPaymentType,
  TProfile,
  TOrganizationGroup,
  TOrder,
} from "@jsdev_ninja/core";
import { DateView } from "src/components/DateView";
import { Price } from "src/components/Price";
import { FirebaseApi } from "src/lib/firebase";

type ClientFormState = {
  displayName: string;
  email: string;
  phoneNumber: string;
  clientType: TProfile["clientType"];
  paymentType: TProfile["paymentType"];
  companyName: string;
};

type ClientFormErrors = {
  displayName?: string;
  email?: string;
};

const createEmptyClientForm = (): ClientFormState => ({
  displayName: "",
  email: "",
  phoneNumber: "",
  clientType: "user",
  paymentType: "j5",
  companyName: "",
});

export function AdminOrganizationDetailPage() {
  const { t } = useTranslation(["common", "admin"]);
  const { id } = useParams("admin.organization");
  const [organization, setOrganization] = useState<TOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationClients, setOrganizationClients] = useState<TProfile[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<TProfile | null>(null);
  const [clientFormData, setClientFormData] = useState<ClientFormState>(createEmptyClientForm);
  const [clientFormErrors, setClientFormErrors] = useState<ClientFormErrors>({});
  const [clientSearchEmail, setClientSearchEmail] = useState("");
  const [clientSearchResult, setClientSearchResult] = useState<TProfile | null>(null);
  const [clientSearchExistingOrg, setClientSearchExistingOrg] = useState<TOrganization | null>(
    null
  );
  const [clientSearchError, setClientSearchError] = useState<string | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);
  const [isAddBillingModalOpen, setIsAddBillingModalOpen] = useState(false);
  const [isEditBillingModalOpen, setIsEditBillingModalOpen] = useState(false);
  const [editingBillingAccount, setEditingBillingAccount] = useState<{
    number: string;
    name: string;
    id: string;
  } | null>(null);
  const [billingFormData, setBillingFormData] = useState<{
    number: string;
    name: string;
    id: string;
  }>({
    number: "",
    name: "",
    id: "",
  });
  const [isEditOrganizationModalOpen, setIsEditOrganizationModalOpen] = useState(false);
  const [organizationFormData, setOrganizationFormData] = useState<{
    name: string;
    discountPercentage: number | undefined;
    nameOnInvoice: string;
    paymentType: TPaymentType;
    companyNumber: string;
    groupId: string | undefined;
  }>({
    name: "",
    discountPercentage: undefined,
    nameOnInvoice: "",
    paymentType: "j5",
    companyNumber: "",
    groupId: undefined,
  });
  const [isSubmittingOrganization, setIsSubmittingOrganization] = useState(false);
  const [organizationGroups, setOrganizationGroups] = useState<TOrganizationGroup[]>([]);
  const [organizationGroupsLoading, setOrganizationGroupsLoading] = useState(false);
  const [organizationOrders, setOrganizationOrders] = useState<TOrder[]>([]);
  const [organizationInvoices, setOrganizationInvoices] = useState<TOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [budgetAccount, setBudgetAccount] = useState<{
    totalDebits: number;
    totalCredits: number;
    balance: number;
  } | null>(null);
  const [actions, setActions] = useState<Array<{
    id: string;
    type: "order.created" | "delivery_note.created" | "invoice.created" | "payment.completed";
    orderId: string;
    orderTotal: number;
    billingAccountId: string | null;
    billingAccountName: string | null;
    billingAccountNumber: string | null;
    date: number;
    meta: Record<string, unknown>;
  }>>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsBillingFilter, setActionsBillingFilter] = useState<string>("");

  const appApi = useAppApi();

  useEffect(() => {
    if (id) {
      loadOrganization(id);
      FirebaseApi.api.getBudgetAccount(id).then((res) => {
        if (res.success && res.data) setBudgetAccount(res.data as { totalDebits: number; totalCredits: number; balance: number });
      }).catch(() => {});
    }
    loadOrganizationGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOrganizationGroups = async () => {
    setOrganizationGroupsLoading(true);
    try {
      const result = await appApi.admin.listOrganizationGroups();
      if (result?.success) {
        setOrganizationGroups((result.data || []) as TOrganizationGroup[]);
      }
    } catch (error) {
      console.error("Failed to load organization groups:", error);
    } finally {
      setOrganizationGroupsLoading(false);
    }
  };

  const loadOrganization = async (organizationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await appApi.admin.listOrganizations();
      if (result?.success && result.data) {
        const org = result.data.find((o) => o.id === organizationId);
        if (org) {
          setOrganization(org as TOrganization);
          await loadOrganizationClients(org.id);
          await loadOrganizationOrders(org.id);
          await loadOrganizationInvoices(org.id);
        } else {
          setError(t("admin:organizationsPage.organizationNotFound"));
        }
      } else {
        setError(t("admin:organizationsPage.failedToLoad"));
      }
    } catch (error) {
      console.error("Failed to load organization:", error);
      setError(t("admin:organizationsPage.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationOrders = async (organizationId: string) => {
    setOrdersLoading(true);
    try {
      const result = await appApi.admin.getOrganizationOrders(organizationId);
      if (result?.success) {
        setOrganizationOrders((result.data || []) as TOrder[]);
      }
    } catch (error) {
      console.error("Failed to load organization orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadOrganizationInvoices = async (organizationId: string) => {
    setInvoicesLoading(true);
    try {
      const result = await appApi.admin.getOrganizationInvoices(organizationId);
      if (result?.success) {
        setOrganizationInvoices((result.data || []) as TOrder[]);
      }
    } catch (error) {
      console.error("Failed to load organization invoices:", error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadActions = async (billingAccountId?: string) => {
    if (!id) return;
    setActionsLoading(true);
    try {
      const res = await FirebaseApi.api.getOrganizationActions(id, billingAccountId || undefined);
      if (res.success) setActions(res.data);
    } catch (err) {
      console.error("Failed to load organization actions:", err);
    } finally {
      setActionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "actions" && actions.length === 0 && !actionsLoading) {
      loadActions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadOrganizationClients = async (organizationId: string) => {
    setClientsLoading(true);
    setClientsError(null);
    try {
      const result = await appApi.admin.listOrganizationClients(organizationId);
      if (result?.success) {
        setOrganizationClients((result.data || []) as TProfile[]);
      } else {
        setClientsError(t("admin:organizationsPage.failedToLoadUsers"));
        setOrganizationClients([]);
      }
    } catch (error) {
      console.error("Failed to load organization clients:", error);
      setClientsError(t("admin:organizationsPage.failedToLoadUsers"));
      setOrganizationClients([]);
    } finally {
      setClientsLoading(false);
    }
  };

  const resetClientSearch = () => {
    setClientSearchEmail("");
    setClientSearchResult(null);
    setClientSearchExistingOrg(null);
    setClientSearchError(null);
    setIsSearchingClient(false);
  };

  const resetClientForm = () => {
    setClientFormData(createEmptyClientForm());
    setClientFormErrors({});
  };

  const handleClientFormChange = <K extends keyof ClientFormState>(
    field: K,
    value: ClientFormState[K]
  ) => {
    setClientFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateClientForm = () => {
    const errors: ClientFormErrors = {};

    if (!clientFormData.displayName.trim()) {
      errors.displayName = t("admin:organizationsPage.errors.displayNameRequired");
    }

    if (!clientFormData.email.trim()) {
      errors.email = t("admin:organizationsPage.errors.emailRequired");
    }

    setClientFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddClientModal = () => {
    resetClientSearch();
    setIsAddClientModalOpen(true);
  };

  const handleSearchClient = async () => {
    setClientSearchError(null);
    setClientSearchResult(null);
    setClientSearchExistingOrg(null);

    const email = clientSearchEmail.trim();
    if (!email) {
      setClientSearchError(t("admin:organizationsPage.errors.emailRequired"));
      return;
    }

    try {
      setIsSearchingClient(true);
      const result = await appApi.admin.findClientByEmail(email);
      if (result?.success && result.data) {
        const profile = result.data as TProfile;
        setClientSearchResult(profile);

        const profileOrgIds: string[] =
          profile.organizationIds && profile.organizationIds.length > 0
            ? profile.organizationIds
            : profile.organizationId
            ? [profile.organizationId]
            : [];

        if (organization && profileOrgIds.includes(organization.id)) {
          setClientSearchExistingOrg(organization);
        }
      } else {
        setClientSearchError(t("admin:organizationsPage.clientNotFound"));
      }
    } catch (error) {
      console.error("Failed to search client by email:", error);
      setClientSearchError(t("admin:organizationsPage.failedToLoadUsers"));
    } finally {
      setIsSearchingClient(false);
    }
  };

  const handleAddClient = async () => {
    if (!organization || !clientSearchResult || clientSearchExistingOrg) return;

    try {
      setIsSubmittingClient(true);
      const result = await appApi.admin.assignClientToOrganization({
        clientId: clientSearchResult.id,
        organizationId: organization.id,
      });

      if (result?.success) {
        setIsAddClientModalOpen(false);
        resetClientSearch();
        await loadOrganizationClients(organization.id);
      }
    } catch (error) {
      console.error("Failed to assign client to organization:", error);
      setClientSearchError(t("admin:organizationsPage.failedToAssignClient"));
    } finally {
      setIsSubmittingClient(false);
    }
  };

  const openEditClientModal = (client: TProfile) => {
    setEditingClient(client);
    setClientFormErrors({});
    setClientFormData({
      displayName: client.displayName || "",
      email: client.email || "",
      phoneNumber: client.phoneNumber || "",
      clientType: client.clientType,
      paymentType: client.paymentType,
      companyName: client.companyName || "",
    });
    setIsEditClientModalOpen(true);
  };

  const handleEditClient = async () => {
    if (!organization || !editingClient) return;
    if (!validateClientForm()) return;

    try {
      setIsSubmittingClient(true);

      const existingOrgIds: string[] = editingClient.organizationIds ?? [];
      const mergedOrgIds = existingOrgIds.includes(organization.id)
        ? existingOrgIds
        : [...existingOrgIds, organization.id];

      const updatedClient: TProfile = {
        ...editingClient,
        displayName: clientFormData.displayName.trim(),
        email: clientFormData.email.trim(),
        phoneNumber: clientFormData.phoneNumber ? clientFormData.phoneNumber.trim() : undefined,
        clientType: clientFormData.clientType,
        paymentType: clientFormData.paymentType,
        companyName: clientFormData.companyName ? clientFormData.companyName.trim() : undefined,
        lastActivityDate: Date.now(),
        organizationId: organization.id,
        organizationIds: mergedOrgIds,
      };

      const result = await appApi.admin.updateClient(updatedClient);
      if (result?.success) {
        setIsEditClientModalOpen(false);
        setEditingClient(null);
        resetClientForm();
        await loadOrganizationClients(organization.id);
      }
    } catch (error) {
      console.error("Failed to update organization client:", error);
    } finally {
      setIsSubmittingClient(false);
    }
  };

  const handleRemoveClient = async (client: TProfile) => {
    if (!organization) return;

    if (
      !window.confirm(
        t("admin:organizationsPage.confirmRemoveOrganizationUser", {
          name: client.displayName,
        })
      )
    ) {
      return;
    }

    try {
      const result = await appApi.admin.removeClientFromOrganization(client.id, organization.id);
      if (result?.success) {
        await loadOrganizationClients(organization.id);
      }
    } catch (error) {
      console.error("Failed to remove client from organization:", error);
    }
  };

  const renderClientDetailsForm = () => (
    <>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-start">{t("common:name")}</label>
        <Input
          placeholder={t("admin:organizationsPage.clientNamePlaceholder")}
          value={clientFormData.displayName}
          onChange={(event) => handleClientFormChange("displayName", event.target.value)}
        />
        {clientFormErrors.displayName && (
          <p className="text-sm text-danger">{clientFormErrors.displayName}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-start">{t("common:email")}</label>
        <Input
          type="email"
          placeholder={t("admin:organizationsPage.clientEmailPlaceholder")}
          value={clientFormData.email}
          onChange={(event) => handleClientFormChange("email", event.target.value)}
        />
        {clientFormErrors.email && (
          <p className="text-sm text-danger">{clientFormErrors.email}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-start">{t("common:phone")}</label>
        <Input
          placeholder={t("admin:organizationsPage.clientPhonePlaceholder")}
          value={clientFormData.phoneNumber}
          onChange={(event) => handleClientFormChange("phoneNumber", event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-start">{t("common:clientType")}</label>
        <Select
          selectedKey={clientFormData.clientType}
          onSelectionChange={(key: Key | null) =>
            handleClientFormChange("clientType", String(key) as ClientFormState["clientType"])
          }
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="user" textValue={t("common:clientTypes.user")}>
                {t("common:clientTypes.user")}
              </ListBox.Item>
              <ListBox.Item id="company" textValue={t("common:clientTypes.company")}>
                {t("common:clientTypes.company")}
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
      {clientFormData.clientType === "company" && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-start">{t("common:companyName")}</label>
          <Input
            placeholder={t("admin:organizationsPage.clientCompanyNamePlaceholder")}
            value={clientFormData.companyName}
            onChange={(event) => handleClientFormChange("companyName", event.target.value)}
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-start">{t("common:paymentType")}</label>
        <Select
          selectedKey={clientFormData.paymentType ?? null}
          onSelectionChange={(key: Key | null) =>
            handleClientFormChange("paymentType", String(key) as ClientFormState["paymentType"])
          }
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="j5" textValue={t("common:paymentTypes.j5")}>
                {t("common:paymentTypes.j5")}
              </ListBox.Item>
              <ListBox.Item id="external" textValue={t("common:paymentTypes.external")}>
                {t("common:paymentTypes.external")}
              </ListBox.Item>
              <ListBox.Item id="none" textValue={t("common:paymentTypes.none")}>
                {t("common:paymentTypes.none")}
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    </>
  );

  const isBillingNumberTaken = async (number: string, excludeAccountId?: string): Promise<boolean> => {
    const orgsResult = await appApi.admin.listOrganizations();
    if (!orgsResult?.success || !orgsResult.data) return false;

    for (const org of orgsResult.data) {
      for (const ba of org.billingAccounts ?? []) {
        if (ba.number === number && ba.id !== excludeAccountId) {
          return true;
        }
      }
    }
    return false;
  };

  const handleAddBillingAccount = async () => {
    if (!organization) return;

    try {
      if (await isBillingNumberTaken(billingFormData.number)) {
        alert("מספר חשבון חיוב כבר קיים בארגון אחר");
        return;
      }

      const newAccount = {
        ...billingFormData,
        id: crypto.randomUUID(),
      };
      const updatedOrg = {
        ...organization,
        billingAccounts: [...(organization.billingAccounts || []), newAccount],
      };

      const result = await appApi.admin.updateOrganization(updatedOrg);
      if (result?.success) {
        setOrganization(updatedOrg);
        setIsAddBillingModalOpen(false);
        resetBillingForm();
      }
    } catch (error) {
      console.error("Failed to add billing account:", error);
    }
  };

  const handleEditBillingAccount = async () => {
    if (!organization || !editingBillingAccount) return;

    try {
      if (billingFormData.number !== editingBillingAccount.number) {
        if (await isBillingNumberTaken(billingFormData.number, editingBillingAccount.id)) {
          alert("מספר חשבון חיוב כבר קיים בארגון אחר");
          return;
        }
      }

      const updatedOrg = {
        ...organization,
        billingAccounts:
          organization.billingAccounts?.map((account: { id: string; number: string; name: string }) =>
            account.id === editingBillingAccount.id ? billingFormData : account
          ) || [],
      };

      const result = await appApi.admin.updateOrganization(updatedOrg);
      if (result?.success) {
        setOrganization(updatedOrg);
        setIsEditBillingModalOpen(false);
        setEditingBillingAccount(null);
        resetBillingForm();
      }
    } catch (error) {
      console.error("Failed to edit billing account:", error);
    }
  };

  const handleRemoveBillingAccount = async (accountId: string) => {
    if (!organization) return;

    if (window.confirm(t("admin:organizationsPage.confirmDeleteBillingAccount"))) {
      try {
        const updatedOrg = {
          ...organization,
          billingAccounts:
            organization.billingAccounts?.filter(
              (account: { id: string }) => account.id !== accountId
            ) || [],
        };

        const result = await appApi.admin.updateOrganization(updatedOrg);
        if (result?.success) {
          setOrganization(updatedOrg);
        }
      } catch (error) {
        console.error("Failed to remove billing account:", error);
      }
    }
  };

  const openEditBillingModal = (account: { number: string; name: string; id: string }) => {
    setEditingBillingAccount(account);
    setBillingFormData({
      number: account.number,
      name: account.name,
      id: account.id,
    });
    setIsEditBillingModalOpen(true);
  };

  const resetBillingForm = () => {
    setBillingFormData({
      number: "",
      name: "",
      id: "",
    });
  };

  const handleBillingFormChange = (field: string, value: string) => {
    setBillingFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openEditOrganizationModal = () => {
    if (!organization) return;
    const org = organization as TOrganization;
    setOrganizationFormData({
      name: org.name,
      discountPercentage: org.discountPercentage,
      nameOnInvoice: org.nameOnInvoice || "",
      paymentType: (org as { paymentType?: TPaymentType }).paymentType || "default" as TPaymentType,
      companyNumber: org.companyNumber || "",
      groupId: org.groupId || undefined,
    });
    setIsEditOrganizationModalOpen(true);
  };

  const handleOrganizationFormChange = (
    field: keyof typeof organizationFormData,
    value: string | number | undefined
  ) => {
    setOrganizationFormData((prev) => {
      if (field === "groupId") {
        return {
          ...prev,
          [field]:
            value === "" || value === "none" ? undefined : (value as string | undefined),
        };
      }
      return {
        ...prev,
        [field]: value === "" ? undefined : value || "",
      };
    });
  };

  const handleUpdateOrganization = async () => {
    if (!organization) return;

    try {
      setIsSubmittingOrganization(true);
      const updatedOrg: TOrganization = {
        ...organization,
        name: organizationFormData.name.trim(),
        discountPercentage: organizationFormData.discountPercentage,
        nameOnInvoice: organizationFormData.nameOnInvoice.trim(),
        paymentType: organizationFormData.paymentType,
        companyNumber: organizationFormData.companyNumber.trim() || undefined,
        groupId: organizationFormData.groupId || undefined,
      } as TOrganization;

      const result = await appApi.admin.updateOrganization(updatedOrg);
      if (result?.success) {
        setOrganization(updatedOrg);
        setIsEditOrganizationModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to update organization:", error);
    } finally {
      setIsSubmittingOrganization(false);
    }
  };

  const handleBack = () => {
    navigate({ to: "admin.organizations" });
  };

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-start">{t("common:loading")}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg text-red-500 mb-4 text-start">{error}</div>
            <Button onPress={handleBack}>
              <Icon icon="lucide:arrow-right" />
              {t("common:back")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg mb-4 text-start">
              {t("admin:organizationsPage.organizationNotFound")}
            </div>
            <Button onPress={handleBack}>
              <Icon icon="lucide:arrow-right" />
              {t("common:back")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const STATUS_COLORS: Record<TOrder["status"], string> = {
    completed: "#22c38f",
    pending: "#fea73e",
    cancelled: "#fc424a",
    processing: "#fea73e",
    in_delivery: "#fea73e",
    delivered: "#22c38f",
    draft: "#949ca9",
    refunded: "#fc424a",
  };

  const getStatusColor = (status: TOrder["status"]): string =>
    STATUS_COLORS[status] ?? "#949ca9";

  // Billing accounts with a "none" option prefix for org edit modal
  const groupSelectItems = [
    { id: "none", name: t("admin:organizationsPage.noGroup") },
    ...organizationGroups,
  ];

  // Billing accounts list for actions filter
  const orgBillingAccounts = (organization.billingAccounts || []) as Array<{ id: string; name: string }>;

  return (
    <div className="w-full p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onPress={handleBack}
        >
          <Icon icon="lucide:arrow-right" />
          {t("common:back")}
        </Button>
        <h1 className="text-2xl font-bold text-start">{organization.name}</h1>
      </div>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        aria-label="Organization tabs"
      >
        <Tabs.List>
          <Tabs.Tab id="details">{t("admin:organizationsPage.details" as never)}</Tabs.Tab>
          <Tabs.Tab id="orders">{t("admin:organizationsPage.orders" as never)}</Tabs.Tab>
          <Tabs.Tab id="invoices">{t("admin:organizationsPage.invoices" as never)}</Tabs.Tab>
          <Tabs.Tab id="actions">פעולות</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel id="details">{null}</Tabs.Panel>
        <Tabs.Panel id="orders">{null}</Tabs.Panel>
        <Tabs.Panel id="invoices">{null}</Tabs.Panel>
        <Tabs.Panel id="actions">{null}</Tabs.Panel>
      </Tabs>

      {activeTab === "details" && (
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <div className="flex flex-row items-center justify-between w-full">
                  <Card.Title>
                    {t("admin:organizationsPage.basicInfo")}
                  </Card.Title>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={openEditOrganizationModal}
                  >
                    <Icon icon="lucide:edit" />
                    {t("common:edit")}
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                      {t("admin:organizationsPage.name")}
                    </label>
                    <div className="text-lg text-start">{organization.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                      {t("admin:organizationsPage.discountPercentage")}
                    </label>
                    <div className="text-lg text-start">
                      {organization.discountPercentage
                        ? `${organization.discountPercentage}%`
                        : t("admin:organizationsPage.noDiscount")}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                      {t("admin:organizationsPage.nameOnInvoice")}
                    </label>
                    <div className="text-lg text-start">
                      {organization.nameOnInvoice || t("admin:organizationsPage.notSet")}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                      {t("common:paymentType")}
                    </label>
                    <div className="text-lg text-start">
                      {t(
                        `common:paymentTypes.${
                          (organization as { paymentType?: string }).paymentType || "default"
                        }` as never
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                      {t("admin:organizationsPage.companyNumber")}
                    </label>
                    <div className="text-lg text-start">
                      {organization.companyNumber || t("admin:organizationsPage.notSet")}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-start">
                      {t("admin:organizationsPage.group")}
                    </label>
                    <div className="text-lg text-start">
                      {organization.groupId
                        ? organizationGroups.find((g) => g.id === organization.groupId)
                            ?.name || t("admin:organizationsPage.notSet")
                        : t("admin:organizationsPage.notSet")}
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>{t("admin:organizationsPage.organizationId")}</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="text-sm font-mono bg-gray-100 p-3 rounded text-start">
                  {organization.id}
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Budget Balance Section */}
          {budgetAccount && (
            <div className="mt-6">
              <Card>
                <Card.Header>
                  <div className="flex flex-row items-center justify-between w-full">
                    <Card.Title>{t("admin:budget.title", "ניהול תקציב")}</Card.Title>
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => navigate({ to: "admin.budgetOrganization", params: { organizationId: id } })}
                    >
                      <Icon icon="lucide:wallet" />
                      {t("common:view", "צפה")}
                    </Button>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div className="flex gap-6">
                    <div className="flex-1 text-center">
                      <p className="text-sm text-gray-500">{t("admin:budget.totalDebits", "סה״כ חיובים")}</p>
                      <p className="text-xl font-bold text-red-600"><Price price={budgetAccount.totalDebits} /></p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-sm text-gray-500">{t("admin:budget.totalCredits", "סה״כ תשלומים")}</p>
                      <p className="text-xl font-bold text-green-600"><Price price={budgetAccount.totalCredits} /></p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-sm text-gray-500">{t("admin:budget.balance", "יתרת חוב")}</p>
                      <p className={`text-xl font-bold ${budgetAccount.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                        <Price price={budgetAccount.balance} />
                      </p>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}

          {/* Organization Clients Section */}
          <div className="mt-6">
            <Card>
              <Card.Header>
                <div className="flex flex-row items-center justify-between w-full">
                  <Card.Title>{t("admin:organizationsPage.organizationUsers")}</Card.Title>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={handleOpenAddClientModal}
                  >
                    <Icon icon="lucide:plus" />
                    {t("admin:organizationsPage.addOrganizationUser")}
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                {clientsLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-start">{t("common:loading")}</div>
                  </div>
                ) : clientsError ? (
                  <div className="text-sm text-red-500 text-start">{clientsError}</div>
                ) : organizationClients.length > 0 ? (
                  <div className="space-y-4">
                    {organizationClients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-start">
                            {client.displayName}
                          </div>
                          <div className="text-sm text-gray-500 text-start">
                            {client.email}
                          </div>
                          <div className="text-xs text-gray-400 text-start mt-1">
                            {t("common:clientType")}:{" "}
                            {t(`common:clientTypes.${client.clientType}`)} •{" "}
                            {t("common:paymentType")}:{" "}
                            {client.paymentType ? t(`common:paymentTypes.${client.paymentType}`) : t("common:paymentTypes.none")}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => openEditClientModal(client)}
                          >
                            <Icon icon="lucide:edit" />
                            {t("common:edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onPress={() => handleRemoveClient(client)}
                          >
                            <Icon icon="lucide:trash" />
                            {t("common:delete")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-start">
                      {t("admin:organizationsPage.noOrganizationUsers")}
                    </div>
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>

          {/* Billing Accounts Section */}
          <div className="mt-6">
            <Card>
              <Card.Header>
                <div className="flex flex-row items-center justify-between w-full">
                  <Card.Title>{t("admin:organizationsPage.billingAccounts")}</Card.Title>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => setIsAddBillingModalOpen(true)}
                  >
                    <Icon icon="lucide:plus" />
                    {t("admin:organizationsPage.addBillingAccount")}
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                {organization.billingAccounts &&
                organization.billingAccounts.length > 0 ? (
                  <div className="space-y-4">
                    {organization.billingAccounts.map(
                      (account: { id: string; name: string; number: string }, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-start">
                              {account.name}
                            </div>
                            <div className="text-sm font-mono text-gray-500 text-start">
                              {account.number}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onPress={() => openEditBillingModal(account)}
                            >
                              <Icon icon="lucide:edit" />
                              {t("common:edit")}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onPress={() =>
                                handleRemoveBillingAccount(account.id)
                              }
                            >
                              <Icon icon="lucide:trash" />
                              {t("common:delete")}
                            </Button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-start">
                      {t("admin:organizationsPage.noBillingAccounts")}
                    </div>
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="mt-6">
          <Card>
            <Card.Header>
              <Card.Title>{t("admin:organizationsPage.ordersHistory" as never)}</Card.Title>
            </Card.Header>
            <Card.Content>
              {ordersLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-start">{t("common:loading")}</div>
                </div>
              ) : organizationOrders.length > 0 ? (
                <Table aria-label="Orders table">
                  <Table.ScrollContainer>
                    <Table.Content>
                      <Table.Header>
                        <Table.Column>
                          {t("ordersPage:columns.orderId", "Order ID")}
                        </Table.Column>
                        <Table.Column>{t("ordersPage:columns.date", "Date")}</Table.Column>
                        <Table.Column>{t("ordersPage:columns.sum", "Total")}</Table.Column>
                        <Table.Column>
                          {t("ordersPage:columns.status", "Status")}
                        </Table.Column>
                        <Table.Column>
                          {t("ordersPage:columns.paymentType", "Payment Type")}
                        </Table.Column>
                      </Table.Header>
                      <Table.Body>
                        {organizationOrders.map((order) => (
                          <Table.Row key={order.id} id={order.id}>
                            <Table.Cell>
                              <span className="text-sm font-mono">
                                {order.id}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <DateView date={order.date} />
                            </Table.Cell>
                            <Table.Cell>
                              <Price price={order.cart.cartTotal} />
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex gap-2 items-center">
                                <div
                                  className="rounded-full size-2"
                                  style={{
                                    backgroundColor: getStatusColor(order.status),
                                  }}
                                />
                                <span className="text-sm">
                                  {t(
                                    `common:orderStatutes.${order.status}`,
                                    order.status
                                  )}
                                </span>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-sm">
                                {order.paymentType
                                  ? t(
                                      `common:paymentTypes.${order.paymentType}`,
                                      order.paymentType
                                    )
                                  : "-"}
                              </span>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-start">
                    {t("admin:organizationsPage.noOrders" as never)}
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="mt-6">
          <Card>
            <Card.Header>
              <Card.Title>{t("admin:organizationsPage.invoicesHistory" as never)}</Card.Title>
            </Card.Header>
            <Card.Content>
              {invoicesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-start">{t("common:loading")}</div>
                </div>
              ) : organizationInvoices.length > 0 ? (
                <Table aria-label="Invoices table">
                  <Table.ScrollContainer>
                    <Table.Content>
                      <Table.Header>
                        <Table.Column>
                          {t("ordersPage:columns.orderId", "Order ID")}
                        </Table.Column>
                        <Table.Column>{t("ordersPage:columns.date", "Date")}</Table.Column>
                        <Table.Column>{t("ordersPage:columns.sum", "Total")}</Table.Column>
                        <Table.Column>
                          {t("admin:organizationsPage.invoiceNumber" as never)}
                        </Table.Column>
                        <Table.Column>
                          {t("ordersPage:columns.status", "Status")}
                        </Table.Column>
                      </Table.Header>
                      <Table.Body>
                        {organizationInvoices.map((order) => (
                          <Table.Row key={order.id} id={order.id}>
                            <Table.Cell>
                              <span className="text-sm font-mono">
                                #{order.id.slice(-8)}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <DateView date={order.date} />
                            </Table.Cell>
                            <Table.Cell>
                              <Price price={order.cart.cartTotal} />
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-sm font-mono">
                                {order.ezInvoice?.doc_number ||
                                  order.invoice?.number ||
                                  "-"}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex gap-2 items-center">
                                <div
                                  className="rounded-full size-2"
                                  style={{
                                    backgroundColor: getStatusColor(order.status),
                                  }}
                                />
                                <span className="text-sm">
                                  {t(
                                    `common:orderStatutes.${order.status}`,
                                    order.status
                                  )}
                                </span>
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-start">
                    {t("admin:organizationsPage.noInvoices" as never)}
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      )}

      {activeTab === "actions" && (
        <div className="flex flex-col gap-4">
          <Card>
            <Card.Header>
              <div className="flex flex-row items-center justify-between gap-4 w-full">
                <h3 className="text-lg font-semibold">היסטוריית פעולות</h3>
                {orgBillingAccounts.length > 0 && (
                  <Select
                    selectedKey={actionsBillingFilter || null}
                    onSelectionChange={(key: Key | null) => {
                      const val = key ? String(key) : "";
                      setActionsBillingFilter(val);
                      loadActions(val || undefined);
                    }}
                    aria-label="סנן לפי חשבון חיוב"
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="" textValue="כל חשבונות החיוב">
                          כל חשבונות החיוב
                        </ListBox.Item>
                        {orgBillingAccounts.map((ba) => (
                          <ListBox.Item key={ba.id} id={ba.id} textValue={ba.name}>
                            {ba.name}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                )}
              </div>
            </Card.Header>
            <Card.Content>
              {actionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : actions.filter((a) => a.type !== "order.created").length > 0 ? (
                <Table aria-label="organization actions">
                  <Table.ScrollContainer>
                    <Table.Content>
                      <Table.Header>
                        <Table.Column>תאריך</Table.Column>
                        <Table.Column>פעולה</Table.Column>
                        <Table.Column>הזמנה</Table.Column>
                        <Table.Column>סכום</Table.Column>
                        <Table.Column>חשבון חיוב</Table.Column>
                        <Table.Column>פרטים</Table.Column>
                      </Table.Header>
                      <Table.Body>
                        {actions.filter((a) => a.type !== "order.created").map((action) => (
                          <Table.Row key={action.id} id={action.id}>
                            <Table.Cell>
                              <DateView date={action.date} />
                            </Table.Cell>
                            <Table.Cell>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                action.type === "order.created" ? "bg-pink-100 text-pink-800" :
                                action.type === "delivery_note.created" ? "bg-blue-100 text-blue-800" :
                                action.type === "invoice.created" ? "bg-purple-100 text-purple-800" :
                                "bg-green-100 text-green-800"
                              }`}>
                                {action.type === "order.created" ? "הזמנה נוצרה" :
                                action.type === "delivery_note.created" ? "תעודת משלוח" :
                                action.type === "invoice.created" ? "חשבונית" :
                                "תשלום הושלם"}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <button
                                className="text-blue-600 hover:underline text-sm"
                                onClick={() => navigate({ to: "admin.order", params: { id: action.orderId } })}
                              >
                                {action.orderId.slice(0, 8)}...
                              </button>
                            </Table.Cell>
                            <Table.Cell>
                              <Price price={action.orderTotal} />
                            </Table.Cell>
                            <Table.Cell>
                              {action.billingAccountName ?? "—"}
                            </Table.Cell>
                            <Table.Cell>
                              {action.meta?.number ? `#${String(action.meta.number)}` :
                              action.meta?.status ? String(action.meta.status) : "—"}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">אין פעולות</div>
              )}
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Add Organization Client Modal */}
      <Modal
        isOpen={isAddClientModalOpen}
        onOpenChange={(open) => {
          setIsAddClientModalOpen(open);
          if (!open) {
            resetClientSearch();
            setIsSubmittingClient(false);
          }
        }}
      >
        <Modal.Backdrop />
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {t("admin:organizationsPage.addOrganizationUser")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-start">
                    {t("admin:organizationsPage.enterClientEmail")}
                  </label>
                  <Input
                    placeholder={t("admin:organizationsPage.clientEmailPlaceholder")}
                    value={clientSearchEmail}
                    onChange={(event) => setClientSearchEmail(event.target.value)}
                  />
                </div>
                <Button
                  variant="primary"
                  onPress={handleSearchClient}
                  isPending={isSearchingClient}
                  isDisabled={isSubmittingClient}
                >
                  <Icon icon="lucide:search" />
                  {t("admin:organizationsPage.searchClient")}
                </Button>
                {clientSearchError && (
                  <div className="text-start text-red-500 text-sm">
                    {clientSearchError}
                  </div>
                )}
                {clientSearchResult && (
                  <div className="border rounded-lg p-4 space-y-1 text-start bg-gray-50">
                    <div className="text-sm font-medium">
                      {clientSearchResult.displayName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {clientSearchResult.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t("common:clientType")}:{" "}
                      {t(`common:clientTypes.${clientSearchResult.clientType}`)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t("common:paymentType")}:{" "}
                      {clientSearchResult.paymentType ? t(`common:paymentTypes.${clientSearchResult.paymentType}`) : t("common:paymentTypes.none")}
                    </div>
                    {clientSearchExistingOrg && (
                      <div className="mt-3 rounded-md border border-warning-300 bg-warning-50 p-3 text-xs text-warning-600">
                        <div className="font-medium">
                          {clientSearchExistingOrg.id === organization.id
                            ? t(
                                "admin:organizationsPage.alreadyInThisOrganization"
                              )
                            : t("admin:organizationsPage.alreadyInOrganization", {
                                name: clientSearchExistingOrg.name,
                              })}
                        </div>
                        {clientSearchExistingOrg.id !== organization.id && (
                          <div className="mt-1 text-warning-500">
                            {t(
                              "admin:organizationsPage.alreadyInOrganizationDescription",
                              {
                                name: clientSearchExistingOrg.name,
                              }
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="ghost"
                onPress={() => {
                  resetClientSearch();
                  setIsAddClientModalOpen(false);
                }}
              >
                {t("common:cancel")}
              </Button>
              <Button
                variant="primary"
                onPress={handleAddClient}
                isPending={isSubmittingClient}
                isDisabled={
                  !clientSearchResult || isSearchingClient || !!clientSearchExistingOrg
                }
              >
                {t("admin:organizationsPage.assignExistingClient")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal>

      {/* Edit Organization Client Modal */}
      <Modal
        isOpen={isEditClientModalOpen}
        onOpenChange={(open) => {
          setIsEditClientModalOpen(open);
          if (!open) {
            setEditingClient(null);
            resetClientForm();
            setIsSubmittingClient(false);
          }
        }}
      >
        <Modal.Backdrop />
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {t("admin:organizationsPage.editOrganizationUser")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="space-y-3">{renderClientDetailsForm()}</div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="ghost"
                onPress={() => {
                  setIsEditClientModalOpen(false);
                  setEditingClient(null);
                  resetClientForm();
                }}
              >
                {t("common:cancel")}
              </Button>
              <Button
                variant="primary"
                onPress={handleEditClient}
                isPending={isSubmittingClient}
              >
                {t("common:update")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal>

      {/* Add Billing Account Modal */}
      <Modal isOpen={isAddBillingModalOpen} onOpenChange={setIsAddBillingModalOpen}>
        <Modal.Backdrop />
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {t("admin:organizationsPage.addBillingAccount")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-start">
                  {t("admin:organizationsPage.accountName")}
                </label>
                <Input
                  placeholder={t("admin:organizationsPage.accountNamePlaceholder")}
                  value={billingFormData.name}
                  onChange={(e) => handleBillingFormChange("name", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 mt-3">
                <label className="text-sm font-medium text-start">
                  {t("admin:organizationsPage.accountNumber")}
                </label>
                <Input
                  placeholder={t("admin:organizationsPage.accountNumberPlaceholder")}
                  value={billingFormData.number}
                  onChange={(e) => handleBillingFormChange("number", e.target.value)}
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={() => setIsAddBillingModalOpen(false)}>
                {t("common:cancel")}
              </Button>
              <Button variant="primary" onPress={handleAddBillingAccount}>
                {t("common:create")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal>

      {/* Edit Billing Account Modal */}
      <Modal isOpen={isEditBillingModalOpen} onOpenChange={setIsEditBillingModalOpen}>
        <Modal.Backdrop />
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {t("admin:organizationsPage.editBillingAccount")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-start">
                  {t("admin:organizationsPage.accountName")}
                </label>
                <Input
                  placeholder={t("admin:organizationsPage.accountNamePlaceholder")}
                  value={billingFormData.name}
                  onChange={(e) => handleBillingFormChange("name", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 mt-3">
                <label className="text-sm font-medium text-start">
                  {t("admin:organizationsPage.accountNumber")}
                </label>
                <Input
                  placeholder={t("admin:organizationsPage.accountNumberPlaceholder")}
                  value={billingFormData.number}
                  onChange={(e) => handleBillingFormChange("number", e.target.value)}
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={() => setIsEditBillingModalOpen(false)}>
                {t("common:cancel")}
              </Button>
              <Button variant="primary" onPress={handleEditBillingAccount}>
                {t("common:update")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal>

      {/* Edit Organization Modal */}
      <Modal
        isOpen={isEditOrganizationModalOpen}
        onOpenChange={setIsEditOrganizationModalOpen}
      >
        <Modal.Backdrop />
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {t("admin:organizationsPage.editOrganization")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-start">
                    {t("admin:organizationsPage.name")}
                  </label>
                  <Input
                    placeholder={t("admin:organizationsPage.namePlaceholder")}
                    value={organizationFormData.name}
                    onChange={(e) => handleOrganizationFormChange("name", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-start">
                    {t("admin:organizationsPage.discountPercentage")}
                  </label>
                  <Input
                    placeholder={t("admin:organizationsPage.discountPercentagePlaceholder")}
                    type="number"
                    value={organizationFormData.discountPercentage?.toString() || ""}
                    onChange={(e) =>
                      handleOrganizationFormChange(
                        "discountPercentage",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-start">
                    {t("admin:organizationsPage.nameOnInvoice")}
                  </label>
                  <Input
                    placeholder={t("admin:organizationsPage.nameOnInvoicePlaceholder")}
                    value={organizationFormData.nameOnInvoice}
                    onChange={(e) =>
                      handleOrganizationFormChange("nameOnInvoice", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-start">
                    {t("admin:organizationsPage.companyNumber")}
                  </label>
                  <Input
                    placeholder={t("admin:organizationsPage.companyNumberPlaceholder")}
                    value={organizationFormData.companyNumber}
                    onChange={(e) =>
                      handleOrganizationFormChange("companyNumber", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-start">
                    {t("common:paymentType")}
                  </label>
                  <Select
                    selectedKey={organizationFormData.paymentType}
                    onSelectionChange={(key: Key | null) =>
                      handleOrganizationFormChange("paymentType", String(key) as TPaymentType)
                    }
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="j5" textValue={t("common:paymentTypes.j5")}>
                          {t("common:paymentTypes.j5")}
                        </ListBox.Item>
                        <ListBox.Item id="external" textValue={t("common:paymentTypes.external")}>
                          {t("common:paymentTypes.external")}
                        </ListBox.Item>
                        <ListBox.Item id="none" textValue={t("common:paymentTypes.none")}>
                          {t("common:paymentTypes.none")}
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-start">
                    {t("admin:organizationsPage.group")}
                  </label>
                  <Select
                    selectedKey={organizationFormData.groupId ?? "none"}
                    onSelectionChange={(key: Key | null) =>
                      handleOrganizationFormChange(
                        "groupId",
                        key === "none" || key === null ? undefined : String(key)
                      )
                    }
                    isDisabled={organizationGroupsLoading}
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {groupSelectItems.map((group) => (
                          <ListBox.Item key={group.id} id={group.id} textValue={group.name}>
                            {group.name}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={() => setIsEditOrganizationModalOpen(false)}>
                {t("common:cancel")}
              </Button>
              <Button
                variant="primary"
                onPress={handleUpdateOrganization}
                isPending={isSubmittingOrganization}
              >
                {t("common:update")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal>
    </div>
  );
}
