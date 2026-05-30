import React, { useEffect, useState } from "react";
import {
  Card,
  Input,
  Button,
  Select,
  Avatar,
  Badge,
  Modal,
  Spinner,
  useOverlayState,
  ListBox,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { TProfile } from "@jsdev_ninja/core";
import { useParams, navigate } from "src/navigation";
import { useAppApi } from "src/appApi";
import { useTranslation } from "react-i18next";
import type { Key } from "react-aria-components";

// Organization type (from appApi/index.ts)
type TOrganization = {
  id: string;
  name: string;
  discountPercentage?: number;
  nameOnInvoice?: string;
};

type AddressFormProps = {
  address?: TProfile["address"];
  onChange: (address: TProfile["address"]) => void;
};

const AddressForm = ({ address, onChange }: AddressFormProps) => {
  const { t } = useTranslation(["common", "admin"]);
  const [formData, setFormData] = React.useState<TProfile["address"]>(
    address || {
      street: "",
      city: "",
      country: "",
      apartmentEnterNumber: "",
      apartmentNumber: "",
      floor: "",
      streetNumber: "",
    }
  );

  const handleChange = (field: string, value: string) => {
    const updatedAddress = {
      ...formData,
      [field]: value,
    } as TProfile["address"];

    setFormData(updatedAddress);
    onChange(updatedAddress);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1 md:col-span-2">
        <label className="text-sm font-medium">{t("common:street")}</label>
        <Input
          value={formData?.street || ""}
          onChange={(e) => handleChange("street", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">{t("common:city")}</label>
        <Input
          value={formData?.city || ""}
          onChange={(e) => handleChange("city", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">{t("common:streetNumber")}</label>
        <Input
          value={formData?.streetNumber || ""}
          onChange={(e) => handleChange("streetNumber", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">{t("common:apartmentEnterNumber")}</label>
        <Input
          value={formData?.apartmentEnterNumber || ""}
          onChange={(e) => handleChange("apartmentEnterNumber", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">{t("common:apartmentNumber")}</label>
        <Input
          value={formData?.apartmentNumber || ""}
          onChange={(e) => handleChange("apartmentNumber", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">{t("common:floor")}</label>
        <Input
          value={formData?.floor || ""}
          onChange={(e) => handleChange("floor", e.target.value)}
        />
      </div>
    </div>
  );
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("he-IL", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

type ClientProfileHeaderProps = {
  profile: TProfile;
  onRemove: () => void;
};

const ClientProfileHeader = ({ profile, onRemove }: ClientProfileHeaderProps) => {
  const { t } = useTranslation(["common", "admin"]);
  const overlay = useOverlayState();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleRemove = async () => {
    setIsDeleting(true);
    try {
      await onRemove();
    } catch (error) {
      console.error("Failed to remove client:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Avatar color: v3 supports accent|default|danger|success|warning
  // v2 "primary" -> "accent", v2 "secondary" -> "default"
  const avatarColor = profile.clientType === "company" ? "accent" : "default";

  // Badge color for client type: v2 "primary" -> "accent", v2 "secondary" -> "default"
  const clientTypeBadgeColor = profile.clientType === "company" ? "accent" : "default";

  const initials = profile.displayName
    ? profile.displayName.slice(0, 2).toUpperCase()
    : "??";

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar color={avatarColor} size="lg" className="h-16 w-16">
            <Avatar.Fallback color={avatarColor}>{initials}</Avatar.Fallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <div className="flex items-center gap-2 text-default-500">
              <Icon icon="lucide:mail" className="text-sm" />
              <span>{profile.email}</span>
            </div>
            {profile.phoneNumber && (
              <div className="flex items-center gap-2 text-default-500">
                <Icon icon="lucide:phone" className="text-sm" />
                <span>{profile.phoneNumber}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge color={clientTypeBadgeColor}>
              <Badge.Label>
                {t(`common:clientTypes.${profile.clientType}`)}
              </Badge.Label>
            </Badge>
            {profile.isAnonymous && (
              <Badge color="warning">
                <Badge.Label>{t("admin:clientProfile.anonymous")}</Badge.Label>
              </Badge>
            )}
            {profile.organizationId && (
              <Badge color="success">
                <Badge.Label>
                  <div className="flex items-center gap-1">
                    <Icon icon="lucide:building-2" className="w-3 h-3" />
                    {t("admin:clientProfile.organizationMember")}
                  </div>
                </Badge.Label>
              </Badge>
            )}
          </div>
          <div className="text-sm text-default-500">
            <div>
              {t("admin:clientProfile.created")}: {formatDate(profile.createdDate)}
            </div>
            <div>
              {t("admin:clientProfile.lastActivity")}: {formatDate(profile.lastActivityDate)}
            </div>
          </div>
        </div>

        <Button
          variant="danger"
          onPress={overlay.open}
        >
          <Icon icon="lucide:trash-2" />
          {t("admin:clientProfile.removeClient")}
        </Button>
      </div>

      <Modal.Backdrop isOpen={overlay.isOpen} onOpenChange={overlay.setOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{t("admin:clientProfile.confirmRemoval")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>
                {t("admin:clientProfile.removeConfirmMessage")}{" "}
                <strong>{profile.displayName}</strong>?
                {t("admin:clientProfile.actionCannotBeUndone")}
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={overlay.close}>
                {t("common:cancel")}
              </Button>
              <Button variant="danger" onPress={handleRemove} isPending={isDeleting}>
                {t("admin:clientProfile.removeClient")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
};

type ClientProfileFormProps = {
  profile: TProfile;
  onSubmit: (updatedProfile: TProfile) => void;
};

const ClientProfileForm = ({ profile, onSubmit }: ClientProfileFormProps) => {
  const { t } = useTranslation(["common", "admin"]);
  const [formData, setFormData] = React.useState<TProfile>(profile);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleChange = (field: keyof TProfile, value: string | string[] | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field as string]) {
      setErrors((prev) => ({
        ...prev,
        [field as string]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = t("admin:clientProfile.displayNameRequired");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("admin:clientProfile.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("admin:clientProfile.invalidEmailFormat");
    }

    if (formData.phoneNumber && formData.phoneNumber.trim() === "") {
      newErrors.phoneNumber = t("admin:clientProfile.phoneCannotBeEmpty");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Badge color for account status
  const statusBadgeColor = formData.isAnonymous ? "warning" : "success";

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <Card.Content>
          <h2 className="text-xl font-semibold mb-4">
            {t("admin:clientProfile.basicInformation")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">{t("common:name")}</label>
              <Input
                value={formData.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
              />
              {errors.displayName && (
                <p className="text-sm text-danger">{errors.displayName}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">{t("common:email")}</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-danger">{errors.email}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">{t("common:phone")}</label>
              <Input
                value={formData.phoneNumber || ""}
                onChange={(e) => handleChange("phoneNumber", e.target.value)}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-danger">{errors.phoneNumber}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">{t("common:clientType")}</label>
              <Select
                selectedKey={formData.clientType}
                onSelectionChange={(key: Key | null) =>
                  handleChange("clientType", String(key) as TProfile["clientType"])
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

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">{t("common:paymentType")}</label>
              <Select
                selectedKey={formData.paymentType ?? null}
                onSelectionChange={(key: Key | null) =>
                  handleChange("paymentType", String(key))
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

            {formData.clientType === "company" && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">{t("common:companyName")}</label>
                <Input
                  value={formData.companyName || ""}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center h-full">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">
                  {t("admin:clientProfile.accountStatus")}
                </span>
                <Badge color={statusBadgeColor} variant="soft">
                  <Badge.Label>
                    {formData.isAnonymous
                      ? t("admin:clientProfile.anonymous")
                      : t("admin:clientProfile.registered")}
                  </Badge.Label>
                </Badge>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      <OrganizationManagementCard
        profile={formData}
        onOrganizationIdsChange={(organizationIds: string[]) => {
          handleChange("organizationIds", organizationIds);
          handleChange("organizationId", organizationIds[0] ?? null);
        }}
      />

      <Card className="mb-6">
        <Card.Content>
          <h2 className="text-xl font-semibold mb-4">
            {t("admin:clientProfile.addressInformation")}
          </h2>
          <AddressForm
            address={formData.address}
            onChange={(address) => {
              setFormData((prev) => ({ ...prev, address }));
            }}
          />
        </Card.Content>
      </Card>

      <Card className="bg-gray-50 dark:bg-gray-900">
        <Card.Content>
          <h2 className="text-xl font-semibold mb-2 text-gray-600 dark:text-gray-400">
            {t("admin:clientProfile.systemInformation")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t("admin:clientProfile.systemInfoDescription")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-500">
                {t("admin:clientProfile.clientId")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400">
                  <Icon icon="lucide:fingerprint" />
                </span>
                <Input
                  value={formData.id}
                  disabled
                  className="pl-8 text-gray-500 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-500">
                {t("admin:clientProfile.companyId")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400">
                  <Icon icon="lucide:building" />
                </span>
                <Input
                  value={formData.companyId}
                  disabled
                  className="pl-8 text-gray-500 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-500">
                {t("admin:clientProfile.storeId")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400">
                  <Icon icon="lucide:store" />
                </span>
                <Input
                  value={formData.storeId}
                  disabled
                  className="pl-8 text-gray-500 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-500">
                {t("admin:clientProfile.tenantId")}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-gray-400">
                  <Icon icon="lucide:layers" />
                </span>
                <Input
                  value={formData.tenantId}
                  disabled
                  className="pl-8 text-gray-500 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                />
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost">
          {t("common:cancel")}
        </Button>
        <Button
          variant="primary"
          type="submit"
          isPending={isSubmitting}
        >
          {!isSubmitting && <Icon icon="lucide:save" />}
          {t("admin:clientProfile.saveChanges")}
        </Button>
      </div>
    </form>
  );
};

type OrganizationManagementCardProps = {
  profile: TProfile;
  onOrganizationIdsChange: (organizationIds: string[]) => void;
};

const OrganizationManagementCard = ({
  profile,
  onOrganizationIdsChange,
}: OrganizationManagementCardProps) => {
  const { t } = useTranslation(["common", "admin"]);
  const appApi = useAppApi();
  const [organizations, setOrganizations] = useState<TOrganization[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedIds: string[] = profile.organizationIds && profile.organizationIds.length > 0
    ? profile.organizationIds
    : profile.organizationId
    ? [profile.organizationId]
    : [];

  useEffect(() => {
    loadOrganizations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const result = await appApi.admin.listOrganizations();
      if (result?.success) {
        setOrganizations(result.data || []);
      }
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <Card.Content>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {t("admin:clientProfile.organizationManagement")}
          </h2>
          {loading && <Spinner size="sm" />}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              {t("admin:clientProfile.assignToOrganization")}
            </label>
            <ListBox
              selectionMode="multiple"
              selectedKeys={new Set(selectedIds)}
              onSelectionChange={(keys) => {
                if (keys === "all") return;
                onOrganizationIdsChange(Array.from(keys as Set<string>).map(String));
              }}
              aria-label={t("admin:clientProfile.selectOrganization")}
              className="border rounded-md max-h-48 overflow-y-auto"
            >
              {organizations.map((org) => (
                <ListBox.Item key={org.id} id={org.id} textValue={org.name}>
                  {org.name}
                  {org.discountPercentage &&
                    ` (${org.discountPercentage}% ${t("admin:clientProfile.discount")})`}
                </ListBox.Item>
              ))}
            </ListBox>
          </div>

          {organizations.length === 0 && !loading && (
            <div className="text-center py-4">
              <p className="text-default-500 mb-2">
                {t("admin:clientProfile.noOrganizationsFound")}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  navigate({ to: "admin.organizations" });
                }}
              >
                <Icon icon="lucide:plus" />
                {t("admin:clientProfile.createOrganization")}
              </Button>
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  );
};

export default function AdminClientProfile() {
  const { t } = useTranslation(["common", "admin"]);
  const params = useParams("admin.clientProfile");
  const clientId = params.id;
  const appApi = useAppApi();

  const [client, setClient] = useState<TProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function updateProfile(updatedProfile: TProfile) {
    try {
      const result = await appApi.admin.updateClient(updatedProfile);
      if (result?.success) {
        setClient(updatedProfile);
      } else {
        console.error("Failed to update profile:", result);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }

  function removeProfile() {
    // TODO: Implement profile removal logic
  }

  useEffect(() => {
    if (!clientId) return;

    setLoading(true);
    appApi.admin
      .getClient(clientId)
      .then((res) => {
        if (res?.success) {
          setClient(res.data);
          setError(null);
        } else {
          setError(t("admin:clientProfile.clientProfileNotFound"));
        }
      })
      .catch((err) => {
        console.error("Error fetching client:", err);
        setError(t("admin:clientProfile.errorLoadingProfile"));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold text-danger mb-2">
          {t("admin:clientProfile.errorLoadingProfile")}
        </h2>
        <p className="text-default-600">
          {error || t("admin:clientProfile.clientProfileNotFound")}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <ClientProfileHeader profile={client} onRemove={removeProfile} />
      <div className="mt-6">
        <ClientProfileForm profile={client} onSubmit={updateProfile} />
      </div>
    </div>
  );
}
