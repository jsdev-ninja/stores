import React, { useEffect, useState } from "react";
import {
  Card,
  Input,
  Select,
  ListBox,
  Chip,
  Separator,
  Table,
  Button,
  Modal,
  useOverlayState,
  ComboBox,
} from "@heroui/react";
import { Trash2, Plus } from "lucide-react";
import { navigate, useParams } from "src/navigation";
import { useAppApi } from "src/appApi";
import { getCartCost, TOrder, TProduct } from "@jsdev_ninja/core";
import { useStore } from "src/domains/Store";
import { useDiscounts } from "src/domains/Discounts/Discounts";
import { useTranslation } from "react-i18next";
import algoliasearch from "algoliasearch/lite";
import type { Key } from "@react-types/shared";

interface OrderItemsTableProps {
  items: TOrder["cart"]["items"];
  onUpdateItem: (itemId: string, field: keyof TOrder["cart"]["items"][number], value: unknown) => void;
  onRemoveItem: (itemId: string) => void;
}

export function OrderItemsTable({ items, onUpdateItem, onRemoveItem }: OrderItemsTableProps) {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Order items table">
          <Table.Header>
            <Table.Column isRowHeader>PRODUCT</Table.Column>
            <Table.Column>QUANTITY</Table.Column>
            <Table.Column>PRICE</Table.Column>
            <Table.Column>SUBTOTAL</Table.Column>
            <Table.Column>ACTIONS</Table.Column>
          </Table.Header>
          <Table.Body>
            {items.map((item) => (
              <Table.Row key={item.product.id} id={item.product.id}>
                <Table.Cell>
                  <Input disabled value={item.product.name[0].value} />
                </Table.Cell>
                <Table.Cell>
                  <Input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={item.amount.toString()}
                    onChange={(e) =>
                      onUpdateItem(item.product.id, "amount", parseFloat(e.target.value) || 0)
                    }
                  />
                </Table.Cell>
                <Table.Cell>
                  <Input
                    disabled
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.product.price.toString()}
                  />
                </Table.Cell>
                <Table.Cell>${(item.amount * item.product.price).toFixed(2)}</Table.Cell>
                <Table.Cell>
                  <Button
                    isIconOnly
                    variant="danger"
                    onPress={() => onRemoveItem(item.product.id)}
                  >
                    <Trash2 />
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

const STATUS_COLOR_MAP: Record<string, "warning" | "accent" | "success" | "danger" | "default"> = {
  pending: "warning",
  processing: "accent",
  completed: "success",
  canceled: "danger",
};

export default function AdminOrderPage() {
  const [order, setOrder] = React.useState<TOrder | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedProductInputValue, setSelectedProductInputValue] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [searchResults, setSearchResults] = useState<TProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const addProductOverlay = useOverlayState();
  const addExternalOverlay = useOverlayState();

  const [externalProductName, setExternalProductName] = useState<string>("");
  const [externalProductPrice, setExternalProductPrice] = useState<number>(0);
  const [externalProductQuantity, setExternalProductQuantity] = useState<number>(1);

  const appApi = useAppApi();
  const { id } = useParams("admin.order");
  const { t } = useTranslation(["common"]);

  const store = useStore();
  const discounts = useDiscounts();

  const algoliaClient = algoliasearch("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");
  const productsIndex = algoliaClient.initIndex("products");

  async function save() {
    if (!order) return;
    const res = await appApi.admin.updateOrder({ order });
    if (res?.success) {
      navigate({ to: "admin.orders" });
    }
  }

  async function handleProductSearch(query: string) {
    setSelectedProductInputValue(query);
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { hits } = await productsIndex.search<TProduct>(query, {
        filters: `storeId:${store?.id} AND companyId:${store?.companyId}`,
        hitsPerPage: 10,
      });
      setSearchResults(hits);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function addProductToOrder() {
    if (!order || !selectedProduct || selectedQuantity <= 0) return;
    const product = searchResults.find((p) => p.id === selectedProduct);
    if (!product) return;

    const existingItemIndex = order.cart.items.findIndex(
      (item) => item.product.id === selectedProduct
    );

    setOrder((prev) => {
      if (!prev) return prev;
      if (!store) return prev;

      const updatedItems = [...prev.cart.items];

      if (existingItemIndex >= 0) {
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          amount: updatedItems[existingItemIndex].amount + selectedQuantity,
        };
      } else {
        updatedItems.push({
          product: product,
          originalPrice: product.price,
          finalPrice: product.price,
          finalDiscount: 0,
          amount: selectedQuantity,
        });
      }

      const cartCost = getCartCost({
        cart: updatedItems,
        discounts: discounts,
        deliveryPrice: prev.storeOptions?.deliveryPrice ?? 0,
        freeDeliveryPrice: prev.storeOptions?.freeDeliveryPrice ?? 0,
        isVatIncludedInPrice: prev.storeOptions?.isVatIncludedInPrice ?? false,
      });

      return {
        ...prev,
        cart: {
          ...prev.cart,
          items: updatedItems,
          cartDiscount: cartCost.discount,
          cartTotal: cartCost.finalCost,
          cartVat: cartCost.vat,
          deliveryPrice: cartCost.deliveryPrice,
        },
      };
    });

    setSelectedProduct("");
    setSelectedProductInputValue("");
    setSelectedQuantity(1);
    setSearchResults([]);
    addProductOverlay.close();
  }

  function addExternalProductToOrder() {
    if (
      !order ||
      !externalProductName.trim() ||
      externalProductPrice <= 0 ||
      externalProductQuantity <= 0
    )
      return;

    const externalId = `external-${Date.now()}-${Math.random()}`;
    const externalProduct: TProduct = {
      type: "Product",
      id: externalId,
      objectID: externalId,
      sku: `EXT-${Date.now()}`,
      name: [{ value: externalProductName, lang: "he" }],
      description: [{ value: "External product", lang: "he" }],
      price: externalProductPrice,
      storeId: store?.id || "",
      companyId: store?.companyId || "",
      isPublished: true,
      vat: true,
      priceType: { type: "unit", value: 1 },
      currency: "ILS",
      discount: { type: "none", value: 0 },
      weight: { value: 0, unit: "none" },
      volume: { value: 0, unit: "none" },
      images: [],
      manufacturer: "",
      brand: "",
      importer: "",
      supplier: "",
      ingredients: [],
      created_at: Date.now(),
      updated_at: Date.now(),
      categoryIds: [],
    };

    setOrder((prev) => {
      if (!prev) return prev;
      if (!store) return prev;
      const updatedItems = [
        ...prev.cart.items,
        {
          product: externalProduct,
          originalPrice: externalProductPrice,
          finalPrice: externalProductPrice,
          finalDiscount: 0,
          amount: externalProductQuantity,
        },
      ];

      const cartCost = getCartCost({
        cart: updatedItems,
        discounts: discounts,
        deliveryPrice: prev.storeOptions?.deliveryPrice ?? 0,
        freeDeliveryPrice: prev.storeOptions?.freeDeliveryPrice ?? 0,
        isVatIncludedInPrice: prev.storeOptions?.isVatIncludedInPrice ?? false,
      });

      return {
        ...prev,
        cart: {
          ...prev.cart,
          items: updatedItems,
          cartDiscount: cartCost.discount,
          cartTotal: cartCost.finalCost,
          cartVat: cartCost.vat,
          deliveryPrice: cartCost.deliveryPrice,
        },
      };
    });

    setExternalProductName("");
    setExternalProductPrice(0);
    setExternalProductQuantity(1);
    addExternalOverlay.close();
  }

  useEffect(() => {
    if (!id) return;
    appApi.admin.getOrder(id).then((res) => {
      if (res?.success) {
        setOrder(res.data);
      }
    });
  }, [id]);

  // Recalculate cart cost when delivery price or discounts change
  useEffect(() => {
    if (!order || !store) return;

    const updatedItems = order.cart.items;
    const cartCost = getCartCost({
      cart: updatedItems,
      discounts: discounts,
      deliveryPrice: order.storeOptions?.deliveryPrice ?? 0,
      freeDeliveryPrice: order.storeOptions?.freeDeliveryPrice ?? 0,
      isVatIncludedInPrice: order.storeOptions?.isVatIncludedInPrice ?? false,
    });

    setOrder({
      ...order,
      cart: {
        ...order.cart,
        cartDiscount: cartCost.discount,
        cartTotal: cartCost.finalCost,
        cartVat: cartCost.vat,
        deliveryPrice: cartCost.deliveryPrice,
      },
    });
  }, [store, discounts]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateOrderItem = (itemId: string, field: unknown, value: unknown) => {
    if (!store) return;

    setOrder((prev) => {
      if (!prev) return prev;

      const updatedItems = prev.cart.items.map((item) => {
        if (item.product.id === itemId) {
          if (field === "amount") return { ...item, amount: value as number };
          return { ...item, product: { ...item.product, [field as string]: value } };
        }
        return item;
      });

      const cartCost = getCartCost({
        cart: updatedItems,
        discounts: discounts,
        deliveryPrice: prev.storeOptions?.deliveryPrice ?? 0,
        freeDeliveryPrice: prev.storeOptions?.freeDeliveryPrice ?? 0,
        isVatIncludedInPrice: prev.storeOptions?.isVatIncludedInPrice ?? false,
      });

      return {
        ...prev,
        cart: {
          ...prev.cart,
          items: updatedItems,
          cartDiscount: cartCost.discount,
          cartTotal: cartCost.finalCost,
          cartVat: cartCost.vat,
          deliveryPrice: cartCost.deliveryPrice ?? 0,
        },
      };
    });
  };

  const removeOrderItem = (itemId: string) => {
    if (!store) return;

    setOrder((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.cart.items.filter((item) => item.product.id !== itemId);

      const cartCost = getCartCost({
        cart: updatedItems,
        discounts: discounts,
        deliveryPrice: prev.storeOptions?.deliveryPrice ?? 0,
        freeDeliveryPrice: prev.storeOptions?.freeDeliveryPrice ?? 0,
        isVatIncludedInPrice: prev.storeOptions?.isVatIncludedInPrice ?? false,
      });

      return {
        ...prev,
        cart: {
          ...prev.cart,
          items: updatedItems,
          cartDiscount: cartCost.discount,
          cartTotal: cartCost.finalCost,
          cartVat: cartCost.vat,
          deliveryPrice: cartCost.deliveryPrice,
        },
      };
    });
  };

  const updateNameOnInvoice = (value: string) => {
    setOrder((prev) => {
      if (!prev) return prev;
      return { ...prev, nameOnInvoice: value };
    });
  };

  const updateClientField = (field: string, value: string) => {
    setOrder((prev) => {
      if (!prev) return prev;
      if (!prev.client) return prev;
      return { ...prev, client: { ...prev.client, [field]: value } };
    });
  };

  const updateClientAddress = (field: string, value: string) => {
    setOrder((prev) => {
      if (!prev) return prev;
      if (!prev.client) return prev;
      return {
        ...prev,
        client: {
          ...prev.client,
          address: { ...(prev.client?.address || {}), [field]: value },
        },
      };
    });
  };

  if (!order) return null;

  const statusColor = STATUS_COLOR_MAP[order.status] ?? "default";

  return (
    <div className="p-4 min-h-screen bg-default-50">
      <Card className="max-w-[1200px] mx-auto">
        <Card.Header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Order Details</h1>
            <Chip color={statusColor} variant="soft">
              <Chip.Label>{order.status}</Chip.Label>
            </Chip>
          </div>
          <p className="text-small text-default-500">Order ID: {order.id}</p>
        </Card.Header>
        <Separator />
        <Card.Content className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Customer Name</label>
              <Input
                value={order.client?.displayName}
                onChange={(e) => updateClientField("displayName", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={order.client?.email}
                onChange={(e) => updateClientField("email", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Name on Invoice</label>
              <Input
                value={order.nameOnInvoice || ""}
                placeholder="Name that will appear on invoice"
                onChange={(e) => updateNameOnInvoice(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Client Comment</label>
              <Input
                disabled
                value={order.clientComment || ""}
                placeholder="Client's comment for the store"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Status</label>
              <Select
                selectedKey={order.status}
                onSelectionChange={(key: Key | null) =>
                  setOrder({ ...order, status: String(key) as TOrder["status"] })
                }
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="pending" textValue="Pending">Pending</ListBox.Item>
                    <ListBox.Item id="processing" textValue="Processing">Processing</ListBox.Item>
                    <ListBox.Item id="completed" textValue="Completed">Completed</ListBox.Item>
                    <ListBox.Item id="canceled" textValue="Canceled">Canceled</ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Order Date</label>
              <Input
                value={order.date ? new Date(order.date).toLocaleDateString() : ""}
                disabled
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Delivery Date</label>
              <Input
                type="date"
                value={
                  order.deliveryDate
                    ? new Date(order.deliveryDate).toISOString().split("T")[0]
                    : ""
                }
              />
            </div>
          </div>

          {/* Customer Address Section */}
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Customer Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">City</label>
                <Input
                  value={order.client?.address?.city || ""}
                  onChange={(e) => updateClientAddress("city", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Street</label>
                <Input
                  value={order.client?.address?.street || ""}
                  onChange={(e) => updateClientAddress("street", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Street Number</label>
                <Input
                  value={order.client?.address?.streetNumber || ""}
                  onChange={(e) => updateClientAddress("streetNumber", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Floor</label>
                <Input
                  value={order.client?.address?.floor || ""}
                  onChange={(e) => updateClientAddress("floor", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Apartment Number</label>
                <Input
                  value={order.client?.address?.apartmentNumber || ""}
                  onChange={(e) => updateClientAddress("apartmentNumber", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={order.client?.phoneNumber || ""}
                  onChange={(e) => updateClientField("phoneNumber", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Delivery Price Section */}
          <div className="flex flex-col gap-2 text-start">
            <h2 className="text-lg font-semibold">{t("common:deliveryPrice")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  {t("common:currentDeliveryPrice")}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={store?.deliveryPrice?.toString() || "0.00"}
                    disabled
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <Button
                    variant={!order.storeOptions?.deliveryPrice ? "primary" : "danger"}
                    className={
                      !order.storeOptions?.deliveryPrice
                        ? "bg-green-600 hover:bg-green-700"
                        : undefined
                    }
                    onPress={() => {
                      if (order.storeOptions?.deliveryPrice) {
                        const cartCost = getCartCost({
                          cart: order.cart.items,
                          discounts: discounts,
                          deliveryPrice: 0,
                          freeDeliveryPrice: order.storeOptions?.freeDeliveryPrice ?? 0,
                          isVatIncludedInPrice: order.storeOptions?.isVatIncludedInPrice ?? false,
                        });
                        setOrder({
                          ...order,
                          cart: {
                            ...order.cart,
                            cartDiscount: cartCost.discount,
                            cartTotal: cartCost.finalCost,
                            cartVat: cartCost.vat,
                            deliveryPrice: cartCost.deliveryPrice,
                          },
                          storeOptions: { ...order.storeOptions, deliveryPrice: 0 },
                        });
                      } else {
                        const cartCost = getCartCost({
                          cart: order.cart.items,
                          discounts: discounts,
                          deliveryPrice: store?.deliveryPrice ?? 0,
                          freeDeliveryPrice: order.storeOptions?.freeDeliveryPrice ?? 0,
                          isVatIncludedInPrice: order.storeOptions?.isVatIncludedInPrice ?? false,
                        });
                        setOrder({
                          ...order,
                          cart: {
                            ...order.cart,
                            cartDiscount: cartCost.discount,
                            cartTotal: cartCost.finalCost,
                            cartVat: cartCost.vat,
                            deliveryPrice: cartCost.deliveryPrice,
                          },
                          storeOptions: {
                            ...order.storeOptions,
                            deliveryPrice: store?.deliveryPrice ?? 0,
                          },
                        });
                      }
                    }}
                  >
                    {!order.storeOptions?.deliveryPrice
                      ? t("common:restoreDeliveryPrice")
                      : t("common:removeDeliveryPrice")}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  {!order.storeOptions?.deliveryPrice
                    ? t("common:deliveryPriceRemovedDescription")
                    : t("common:deliveryPriceRemoveDescription")}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Note Section */}
          {order.deliveryNote && (
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">תעודת משלוח (Delivery Note)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">מספר תעודת משלוח</label>
                  <Input
                    value={order.deliveryNote.number || order.deliveryNote.id || ""}
                    disabled
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">תאריך</label>
                  <Input
                    value={
                      order.deliveryNote.date
                        ? new Date(order.deliveryNote.date).toLocaleDateString("he-IL")
                        : ""
                    }
                    disabled
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">סטטוס</label>
                  <Input value={order.deliveryNote.status || ""} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">סה״כ</label>
                  <Input value={order.deliveryNote.total?.toFixed(2) || "0.00"} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">מע״מ</label>
                  <Input value={order.deliveryNote.vat?.toFixed(2) || "0.00"} disabled />
                </div>
                {order.deliveryNote.link && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      קישור לתעודת משלוח
                    </label>
                    <a
                      href={order.deliveryNote.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {order.deliveryNote.link}
                    </a>
                  </div>
                )}
              </div>
              {order.deliveryNote.items && order.deliveryNote.items.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-md font-semibold mb-2">פריטים בתעודת משלוח</h3>
                  <Table>
                    <Table.ScrollContainer>
                      <Table.Content aria-label="Delivery note items">
                        <Table.Header>
                          <Table.Column isRowHeader>שם פריט</Table.Column>
                          <Table.Column>כמות</Table.Column>
                          <Table.Column>מחיר</Table.Column>
                          <Table.Column>סה״כ</Table.Column>
                        </Table.Header>
                        <Table.Body>
                          {order.deliveryNote.items.map((item, index) => (
                            <Table.Row key={index} id={String(index)}>
                              <Table.Cell>{item.name || "-"}</Table.Cell>
                              <Table.Cell>{item.quantity || 0}</Table.Cell>
                              <Table.Cell>₪{item.price?.toFixed(2) || "0.00"}</Table.Cell>
                              <Table.Cell>₪{item.total?.toFixed(2) || "0.00"}</Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* EzDeliveryNote Section */}
          {order.ezDeliveryNote && (
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">תעודת משלוח EzCount (EzDelivery Note)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">מספר מסמך</label>
                  <Input value={order.ezDeliveryNote.doc_number || ""} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">תאריך</label>
                  <Input
                    value={
                      order.ezDeliveryNote.date
                        ? new Date(order.ezDeliveryNote.date).toLocaleDateString("he-IL")
                        : ""
                    }
                    disabled
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">UUID מסמך</label>
                  <Input value={order.ezDeliveryNote.doc_uuid || ""} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">UUID UA</label>
                  <Input value={order.ezDeliveryNote.ua_uuid || ""} disabled />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">הצלחה</label>
                  <Input value={order.ezDeliveryNote.success ? "כן" : "לא"} disabled />
                </div>
                {order.ezDeliveryNote.warning && (
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-sm font-medium">אזהרה</label>
                    <Input value={order.ezDeliveryNote.warning} disabled />
                  </div>
                )}
                {order.ezDeliveryNote.pdf_link && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      קישור PDF
                    </label>
                    <a
                      href={order.ezDeliveryNote.pdf_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {order.ezDeliveryNote.pdf_link}
                    </a>
                  </div>
                )}
                {order.ezDeliveryNote.pdf_link_copy && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      קישור PDF (עותק)
                    </label>
                    <a
                      href={order.ezDeliveryNote.pdf_link_copy}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {order.ezDeliveryNote.pdf_link_copy}
                    </a>
                  </div>
                )}
                {order.ezDeliveryNote.sent_mails && order.ezDeliveryNote.sent_mails.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      אימיילים שנשלחו
                    </label>
                    <div className="flex flex-col gap-1">
                      {order.ezDeliveryNote.sent_mails.map((email, index) => (
                        <span key={index} className="text-sm">
                          {email}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {order.ezDeliveryNote.calculatedData && (
                <div className="mt-4">
                  <h3 className="text-md font-semibold mb-2">נתונים מחושבים</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">מספר עסקה</label>
                      <Input
                        value={order.ezDeliveryNote.calculatedData.transaction_id || ""}
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">תאריך</label>
                      <Input
                        value={order.ezDeliveryNote.calculatedData.date || ""}
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">מטבע</label>
                      <Input
                        value={order.ezDeliveryNote.calculatedData.currency || ""}
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">שער</label>
                      <Input
                        value={order.ezDeliveryNote.calculatedData.rate?.toString() || ""}
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">מע״מ</label>
                      <Input value={order.ezDeliveryNote.calculatedData.vat || ""} disabled />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">מחיר מע״מ</label>
                      <Input
                        value={
                          order.ezDeliveryNote.calculatedData.vat_price?.toFixed(2) || "0.00"
                        }
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">הנחת מחיר</label>
                      <Input
                        value={
                          order.ezDeliveryNote.calculatedData.price_discount?.toFixed(2) || "0.00"
                        }
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">הנחת מחיר במטבע</label>
                      <Input
                        value={
                          order.ezDeliveryNote.calculatedData.price_discount_in_currency?.toFixed(
                            2
                          ) || "0.00"
                        }
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">סה״כ מחיר</label>
                      <Input
                        value={order.ezDeliveryNote.calculatedData.price_total || ""}
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">סה״כ מחיר במטבע</label>
                      <Input
                        value={
                          order.ezDeliveryNote.calculatedData.price_total_in_currency?.toFixed(
                            2
                          ) || "0.00"
                        }
                        disabled
                      />
                    </div>
                    {order.ezDeliveryNote.calculatedData._COMMENT && (
                      <div className="md:col-span-2 flex flex-col gap-1">
                        <label className="text-sm font-medium">הערה</label>
                        <Input
                          value={order.ezDeliveryNote.calculatedData._COMMENT}
                          disabled
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Items Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Order Items</h2>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onPress={addProductOverlay.open}
                >
                  <Plus />
                  Add Product
                </Button>
                <Button
                  variant="outline"
                  onPress={addExternalOverlay.open}
                >
                  <Plus />
                  Add External Product
                </Button>
              </div>
            </div>
            <OrderItemsTable
              items={order.cart.items}
              onUpdateItem={updateOrderItem}
              onRemoveItem={removeOrderItem}
            />
          </div>

          {/* Add Product Modal */}
          <Modal isOpen={addProductOverlay.isOpen} onOpenChange={addProductOverlay.setOpen}>
            <Modal.Backdrop />
            <Modal.Container size="lg">
              <Modal.Dialog>
                <Modal.Header>
                  <Modal.Heading>Add Product to Order</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <div className="space-y-4">
                    <ComboBox
                      selectedKey={selectedProduct || null}
                      onSelectionChange={(key: Key | null) =>
                        setSelectedProduct(key as string)
                      }
                      items={searchResults}
                      inputValue={selectedProductInputValue}
                      onInputChange={handleProductSearch}
                      allowsEmptyCollection
                    >
                      <label className="block text-sm font-medium mb-1">
                        Search and Select Product
                      </label>
                      <ComboBox.InputGroup>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Type to search products..."
                        />
                        {isSearching && (
                          <span className="text-gray-400 text-xs">...</span>
                        )}
                        <ComboBox.Trigger>▾</ComboBox.Trigger>
                      </ComboBox.InputGroup>
                      <ComboBox.Popover>
                        <ListBox items={searchResults}>
                          {(product) => (
                            <ListBox.Item
                              id={product.id}
                              textValue={product.name[0].value}
                              className="p-2 cursor-pointer hover:bg-gray-50"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{product.name[0].value}</span>
                                <span className="text-sm text-gray-500">
                                  ₪{product.price}
                                </span>
                              </div>
                            </ListBox.Item>
                          )}
                        </ListBox>
                      </ComboBox.Popover>
                    </ComboBox>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Quantity</label>
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={selectedQuantity.toString()}
                        onChange={(e) =>
                          setSelectedQuantity(parseFloat(e.target.value) || 0.01)
                        }
                      />
                    </div>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="ghost" onPress={addProductOverlay.close}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onPress={addProductToOrder}
                    isDisabled={!selectedProduct || selectedQuantity <= 0}
                  >
                    Add to Order
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal>

          {/* Add External Product Modal */}
          <Modal isOpen={addExternalOverlay.isOpen} onOpenChange={addExternalOverlay.setOpen}>
            <Modal.Backdrop />
            <Modal.Container size="md">
              <Modal.Dialog>
                <Modal.Header>
                  <Modal.Heading>Add External Product to Order</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Product Name</label>
                      <Input
                        placeholder="Enter product name..."
                        value={externalProductName}
                        onChange={(e) => setExternalProductName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Price (₪)</label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={externalProductPrice.toString()}
                        onChange={(e) =>
                          setExternalProductPrice(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium">Quantity</label>
                      <Input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={externalProductQuantity.toString()}
                        onChange={(e) =>
                          setExternalProductQuantity(parseFloat(e.target.value) || 0.01)
                        }
                      />
                    </div>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="ghost" onPress={addExternalOverlay.close}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onPress={addExternalProductToOrder}
                    isDisabled={
                      !externalProductName.trim() ||
                      externalProductPrice <= 0 ||
                      externalProductQuantity <= 0
                    }
                  >
                    Add to Order
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal>
        </Card.Content>
        <Separator />
        <Card.Footer>
          <div className="flex flex-col gap-2 ml-auto">
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {t("common:subtotal")}: ₪{order?.cart.cartTotal.toFixed(2)}
              </p>
              {!order.storeOptions?.deliveryPrice && (
                <p className="text-sm text-green-600">
                  {t("common:deliveryPrice")}: ₪0.00 ({t("common:waived")})
                </p>
              )}
              {order.storeOptions?.deliveryPrice && (
                <p className="text-sm text-gray-600">
                  {t("common:deliveryPrice")}: ₪{(store?.deliveryPrice ?? 0).toFixed(2)}
                </p>
              )}
              <p className="text-xl font-semibold">
                {t("common:total")}: ₪{order?.cart.cartTotal.toFixed(2)}
              </p>
            </div>
          </div>
          <Button onPress={save}>save</Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
