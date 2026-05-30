import { useEffect, useState, useCallback } from "react";
import { Button } from "src/components/button";
import { Modal, Input, Table } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { TOrganizationGroup, TNewOrganizationGroup } from "@jsdev_ninja/core";

export function AdminOrganizationGroupsPage() {
  const { t } = useTranslation(["common", "admin"]);
  const [organizationGroups, setOrganizationGroups] = useState<TOrganizationGroup[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<TNewOrganizationGroup>({
    name: "",
  });

  const appApi = useAppApi();

  const loadOrganizationGroups = useCallback(async () => {
    try {
      const result = await appApi.admin.listOrganizationGroups();
      if (result?.success) {
        setOrganizationGroups((result.data || []) as TOrganizationGroup[]);
      }
    } catch (error) {
      console.error("Failed to load organization groups:", error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadOrganizationGroups();
  }, [loadOrganizationGroups]);

  const handleCreate = async () => {
    try {
      const result = await appApi.admin.createOrganizationGroup(formData);
      if (result?.success) {
        await loadOrganizationGroups();
        setIsCreateModalOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create organization group:", error);
    }
  };

  const handleDelete = async (organizationGroupId: string) => {
    if (window.confirm(t("admin:organizationGroupsPage.confirmDelete"))) {
      try {
        const result = await appApi.admin.deleteOrganizationGroup(organizationGroupId);
        if (result?.success) {
          await loadOrganizationGroups();
        }
      } catch (error) {
        console.error("Failed to delete organization group:", error);
      }
    }
  };

  const handleFormChange = (field: keyof TNewOrganizationGroup, value: string) => {
    setFormData((prev: TNewOrganizationGroup) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
    });
  };

  return (
    <div className="w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("admin:organizationGroupsPage.title")}</h1>
        <Button
          variant="primary"
          onPress={() => setIsCreateModalOpen(true)}
        >
          <Icon icon="lucide:plus" />
          {t("admin:organizationGroupsPage.createOrganizationGroup")}
        </Button>
      </div>

      <Table aria-label="Organization groups table">
        <Table.ScrollContainer>
          <Table.Content>
            <Table.Header>
              <Table.Column>{t("admin:organizationGroupsPage.name")}</Table.Column>
              <Table.Column>{t("admin:organizationGroupsPage.actionsLabel")}</Table.Column>
            </Table.Header>
            <Table.Body>
              {organizationGroups.map((organizationGroup) => (
                <Table.Row key={organizationGroup.id} id={organizationGroup.id}>
                  <Table.Cell>{organizationGroup.name}</Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onPress={() => handleDelete(organizationGroup.id)}
                      >
                        <Icon icon="lucide:trash" />
                        {t("common:delete")}
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {/* Create Modal */}
      <Modal.Backdrop isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {t("admin:organizationGroupsPage.createOrganizationGroup")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">
                  {t("admin:organizationGroupsPage.name")}
                </label>
                <Input
                  placeholder={t("admin:organizationGroupsPage.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={() => setIsCreateModalOpen(false)}>
                {t("common:cancel")}
              </Button>
              <Button variant="primary" onPress={handleCreate}>
                {t("common:create")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
