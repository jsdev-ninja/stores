import { Icon } from "@iconify/react";

import {
  Card,
  Table,
  Chip,
  Tooltip,
  Separator,
  Input,
  Select,
  ListBox,
  Button,
  ComboBox,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { DiscountSchema, TDiscount, TProduct } from "@jsdev_ninja/core";
import { FirebaseApi } from "src/lib/firebase";
import { useStore } from "src/domains/Store";
import { useAppApi } from "src/appApi";

import { AlgoliaClient } from "src/services";
import { useTranslation } from "react-i18next";

const productsIndex = AlgoliaClient.initIndex("products"); // Replace with your index name

export const categories = [
  { id: "1", name: "Electronics" },
  { id: "2", name: "Clothing" },
  { id: "3", name: "Books" },
  { id: "4", name: "Home & Garden" },
  { id: "5", name: "Sports" },
  { id: "6", name: "Toys" },
];

export const brands = [
  { id: "1", name: "Apple" },
  { id: "2", name: "Nike" },
  { id: "3", name: "Samsung" },
  { id: "4", name: "Adidas" },
  { id: "5", name: "Sony" },
  { id: "6", name: "Levi's" },
];

export const customerTypes = [
  { id: "new", name: "New Customers" },
  { id: "returning", name: "Returning Customers" },
  { id: "vip", name: "VIP Members" },
  { id: "all", name: "All Customers" },
];

type DiscountFormProps = {
  onSubmit: (discount: Partial<TDiscount>) => void;
};

export const DiscountForm: React.FC<DiscountFormProps> = ({ onSubmit }) => {
  const store = useStore();

  const { t } = useTranslation(["common", "admin"]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<TDiscount>({
    resolver: zodResolver(DiscountSchema),
    defaultValues: {
      type: "Discount",
      companyId: store?.companyId ?? "",
      storeId: store?.id ?? "",
      id: FirebaseApi.firestore.generateDocId("discounts"),
      active: true,
      name: [{ lang: "he", value: "" }],
      variant: {
        variantType: "bundle",
        productsId: [],
        requiredQuantity: 0,
        bundlePrice: 0,
      },
      conditions: {
        stackable: false,
      },
      startDate: Date.now(),
      endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    },
  });

  const appApi = useAppApi();

  const onFormSubmit = async (data: TDiscount) => {
    if (data.variant.variantType === "bundle") {
      //todo default image from product - removed from new schema
    }
    await appApi.admin.createDiscount(data);
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <Card.Content>
        <form onSubmit={handleSubmit(onFormSubmit, console.error)} className="space-y-6">
          <div className="space-y-4">
            <Controller
              name="variant.variantType"
              control={control}
              render={({ field }) => {
                return (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("admin:discountsPage.discountType")}
                    </label>
                    <Select
                      selectedKey={field.value ?? null}
                      onSelectionChange={(key) => field.onChange(key)}
                      isDisabled
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          <ListBox.Item id="bundle" textValue={t("common:bundle")}>
                            {t("common:bundle")}
                          </ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                );
              }}
            />
            <Controller
              name={`name.0.value`}
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("common:discountName")}
                  </label>
                  <Input
                    {...field}
                    placeholder="למשל 3 מוצרי חלב ב10"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name?.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="variant.requiredQuantity"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("admin:discountsPage.prodcutQuantity")}
                  </label>
                  <p className="text-xs text-gray-500 mb-1">Number of items in the bundle</p>
                  <Input
                    {...field}
                    onChange={(e) => field.onChange(+e.target.value)}
                    value={field.value as unknown as string}
                    type="number"
                    placeholder="הזן מספר"
                  />
                  {errors?.variant?.requiredQuantity && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors?.variant?.requiredQuantity?.message}
                    </p>
                  )}
                </div>
              )}
            />
            <Controller
              name="variant.bundlePrice"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t("admin:discountsPage.discountFinalPrice")}
                  </label>
                  <p className="text-xs text-gray-500 mb-1">Total price for the bundle</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      {...field}
                      onChange={(e) => field.onChange(+e.target.value)}
                      value={field.value as unknown as string}
                      type="number"
                      placeholder="10.00"
                      className="pl-7"
                    />
                  </div>
                  {errors?.variant?.bundlePrice && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors?.variant?.bundlePrice?.message}
                    </p>
                  )}
                </div>
              )}
            />
            {watch("variant.productsId")?.map((productId, index) => (
              <div key={productId} className="flex items-center gap-2">
                <Controller
                  name={`variant.productsId.${index}`}
                  control={control}
                  render={({ field }) => {
                    return <ProductInput field={field} />;
                  }}
                />
                <Button
                  onPress={() => {
                    const currentProducts = getValues("variant.productsId");
                    setValue(
                      "variant.productsId",
                      currentProducts.filter((_, i) => i !== index)
                    );
                  }}
                  size="lg"
                  variant="danger"
                  isIconOnly
                >
                  <Icon icon="lucide:x" />
                </Button>
              </div>
            ))}
            <Button
              fullWidth
              onPress={() => {
                const currentProducts = getValues("variant.productsId") || [];
                setValue("variant.productsId", [...currentProducts, ""]);
              }}
            >
              {t("addProduct")}
            </Button>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
          >
            <Icon icon="lucide:plus" />
            {t("admin:discountsPage.createDiscount")}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
};

function ProductInput({ field }: { field: { value: string; onChange: (value: string) => void } }) {
  const [searchResults, setSearchResults] = useState<TProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TProduct | null>(null);
  const [inputValue, setInputValue] = useState("");

  const { t } = useTranslation(["common", "admin"]);

  const store = useStore();

  // Sync selected product when search results change
  useEffect(() => {
    if (field.value && searchResults.length > 0) {
      const found = searchResults.find((p) => p.id === field.value || p.objectID === field.value);
      if (found) {
        setSelectedProduct((prev) => {
          // Only update if different
          if (!prev || prev.id !== found.id) {
            return found;
          }
          return prev;
        });
      }
    }
  }, [searchResults, field.value]);

  // Load selected product when field value changes
  useEffect(() => {
    if (!field.value) {
      setSelectedProduct(null);
      setInputValue("");
      return;
    }

    // Check if we already have the product selected
    setSelectedProduct((prev) => {
      if (prev && (prev.id === field.value || prev.objectID === field.value)) {
        return prev;
      }
      return null;
    });

    // Check if product is in search results
    const foundInResults = searchResults.find(
      (p) => p.id === field.value || p.objectID === field.value
    );
    if (foundInResults) {
      return;
    }

    // Load product if not found
    if (store) {
      setIsLoading(true);
      productsIndex
        .search<TProduct>("", {
          filters: `storeId:${store.id} AND companyId:${store.companyId} AND (objectID:"${field.value}" OR id:"${field.value}")`,
        })
        .then(({ hits }) => {
          if (hits.length > 0) {
            setSelectedProduct(hits[0]);
            setInputValue(hits[0].name[0]?.value ?? "");
            setSearchResults((prev) => {
              // Add to results if not already there
              if (!prev.find((p) => p.id === hits[0].id || p.objectID === hits[0].objectID)) {
                return [...prev, hits[0]];
              }
              return prev;
            });
          }
        })
        .catch((error) => {
          console.error("Error loading product:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.value, store]);

  const handleSearch = async (value: string) => {
    setInputValue(value);
    if (!store) return;
    if (!value) {
      // Keep selected product in results if it exists
      if (selectedProduct) {
        setSearchResults([selectedProduct]);
      } else {
        setSearchResults([]);
      }
      return;
    }

    setIsLoading(true);
    try {
      // todo
      const { hits } = await productsIndex.search<TProduct>(value, {
        filters: `storeId:${store.id} AND companyId:${store.companyId}`,
      });

      setSearchResults(hits);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionChange = (id: string | number | null) => {
    if (!id) {
      field.onChange("");
      setSelectedProduct(null);
      setInputValue("");
      return;
    }
    const product = searchResults.find((p) => p.id === id || p.objectID === id);
    if (product) {
      setSelectedProduct(product);
      setInputValue(product.name[0]?.value ?? "");
      // Store the objectID as the value since that's what we use as the key
      field.onChange(product.objectID || product.id);
    } else {
      field.onChange(String(id));
    }
  };

  // Combine search results with selected product if not already included
  const displayItems =
    searchResults.length > 0 ? searchResults : selectedProduct ? [selectedProduct] : [];

  // Get the selected key - use objectID if available, otherwise use the field value
  const selectedKey = selectedProduct?.objectID || field.value || null;

  return (
    <ComboBox
      selectedKey={selectedKey}
      onSelectionChange={handleSelectionChange}
      className="max-w-xl"
      items={displayItems}
      inputValue={inputValue}
      onInputChange={handleSearch}
      allowsEmptyCollection
    >
      <label className="block text-sm font-medium mb-1">{t("common:searchProduct")}</label>
      <ComboBox.InputGroup>
        <div className="relative flex items-center">
          {isLoading ? (
            <span className="absolute left-2 text-gray-400">
              <Icon icon="lucide:loader-2" className="animate-spin" width={16} />
            </span>
          ) : (
            <span className="absolute left-2 text-gray-400">
              <Icon icon="lucide:search" width={16} />
            </span>
          )}
          <input
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t("common:searchProduct")}
          />
        </div>
        <ComboBox.Trigger>
          <Icon icon="lucide:chevron-down" width={16} />
        </ComboBox.Trigger>
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox items={displayItems}>
          {(item) => (
            <ListBox.Item
              id={item.objectID}
              textValue={item.name[0]?.value ?? ""}
              className="flex items-center gap-4 p-2 cursor-pointer hover:bg-gray-50"
            >
              <img
                src={item.images?.[0]?.url}
                alt={item.name[0]?.value}
                className="w-12 h-12 rounded-md object-cover"
              />
              <div className="flex flex-col gap-1">
                <span className="text-gray-900">{item.name[0].value}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">${item.price}</span>
                  <Chip size="sm" variant="soft">
                    <Chip.Label>{item.categoryNames?.[0] || "No category"}</Chip.Label>
                  </Chip>
                </div>
              </div>
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

type DiscountListProps = {
  discounts: TDiscount[];
  setDiscounts: (discounts: TDiscount[]) => void;
};

export const DiscountList: React.FC<DiscountListProps> = ({ discounts, setDiscounts }) => {
  const { t } = useTranslation(["common", "admin"]);

  const appApi = useAppApi();

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Active Discounts">
          <Table.Header>
            <Table.Column isRowHeader>
              {t("admin:discountsPage.tableHeader.name")}
            </Table.Column>
            <Table.Column>{t("admin:discountsPage.tableHeader.type")}</Table.Column>
            <Table.Column>{t("admin:discountsPage.tableHeader.status")}</Table.Column>
            <Table.Column>{t("admin:discountsPage.tableHeader.actions")}</Table.Column>
          </Table.Header>
          <Table.Body>
            {discounts.map((discount) => (
              <Table.Row key={discount.id}>
                <Table.Cell>{discount.name[0].value}</Table.Cell>
                <Table.Cell>
                  <Chip size="sm" variant="soft">
                    <Chip.Label>{discount.variant.variantType}</Chip.Label>
                  </Chip>
                </Table.Cell>
                <Table.Cell>
                  <Chip size="sm" variant="soft">
                    <Chip.Label>{discount.active ? "active" : "not active"}</Chip.Label>
                  </Chip>
                </Table.Cell>
                <Table.Cell>
                  <Button isIconOnly variant="primary" onPress={() => {}}>
                    view
                  </Button>
                  <Tooltip>
                    <Tooltip.Trigger>
                      <Button
                        isIconOnly
                        variant="danger"
                        onPress={async () => {
                          // handle delete
                          const res = await appApi.admin.deleteDiscount(discount.id);
                          if (res?.success) {
                            setDiscounts(discounts.filter((d) => d.id !== discount.id));
                          }
                        }}
                      >
                        <Icon icon="lucide:trash-2" />
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>Delete Discount</Tooltip.Content>
                  </Tooltip>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
};

function AdminDiscountsPage() {
  const [showForm, setShowForm] = useState(false);
  const [discounts, setDiscounts] = useState<TDiscount[]>([]);

  const { t } = useTranslation(["common", "admin"]);

  const appApi = useAppApi();

  const handleCreateDiscount = () => {
    setShowForm(false);
  };

  useEffect(() => {
    const unsubscribe = appApi.admin.subscribeToDiscounts(setDiscounts);

    return () => unsubscribe?.();
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card>
        <Card.Header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t("admin:discountsPage.title")}</h1>
            <p className="text-gray-500">{t("admin:discountsPage.description")}</p>
          </div>
          <Button
            variant="primary"
            onPress={() => setShowForm(!showForm)}
          >
            <Icon icon={showForm ? "lucide:x" : "lucide:plus"} />
            {showForm ? t("common:cancel") : t("admin:discountsPage.createDiscount")}
          </Button>
        </Card.Header>
        <Separator />
        <Card.Content>
          {showForm ? (
            <DiscountForm onSubmit={handleCreateDiscount} />
          ) : (
            <DiscountList setDiscounts={setDiscounts} discounts={discounts} />
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
export default AdminDiscountsPage;
