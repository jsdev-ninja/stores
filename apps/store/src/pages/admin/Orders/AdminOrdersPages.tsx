import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { DateView } from "src/components/DateView";
import { Price } from "src/components/Price";
import { Button } from "src/components/button";
import { TOrder } from "src/domains/Order";
import { modalApi } from "src/infra/modals";
import { submitHypForm } from "src/lib/payment/submitHypForm";
import {
  ChipProps,
  Chip,
  Modal,
  useOverlayState,
} from "@heroui/react";
import { useStore } from "src/domains/Store";

function AdminOrdersPages() {
  const appApi = useAppApi();

  const [orders, setOrders] = useState<TOrder[]>([]);

  function updateOrder(id: string, status: TOrder["status"]) {
    setOrders((orders) =>
      orders.map((order) => (order.id === id ? { ...order, status: status } : order)),
    );
  }

  useEffect(() => {
    appApi.admin.getStoreOrders().then((res) => {
      if (!res) {
        return;
      }
      setOrders(res.data);
    });
  }, []);

  return (
    <section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="mx-auto">
          <div className="mt-6 flow-root sm:mt-8">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => {
                return <OrderRow key={order.id} order={order} updateOrder={updateOrder} />;
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderRow({
  order,
  updateOrder,
}: {
  order: TOrder;
  updateOrder: (id: string, status: TOrder["status"]) => void;
}) {
  const { t } = useTranslation(["common", "ordersPage"]);

  const appApi = useAppApi();

  const store = useStore();

  const cancelOverlay = useOverlayState();

  async function confirmCancelOrder() {
    const res = await appApi.admin.cancelOrder({ order });
    if (!res?.success) {
      cancelOverlay.close();
      return;
    }
    updateOrder(order.id, "cancelled");
    cancelOverlay.close();
  }

  const chipColors: Record<TOrder["status"], ChipProps["color"]> = {
    draft: "default",
    pending: "default",
    processing: "accent",
    cancelled: "danger",
    refunded: "danger",
    completed: "success",
    delivered: "accent",
    in_delivery: "accent",
  };

  function orderMainAction() {
    if (order.status === "in_delivery") {
      return (
        <>
          <Button
            onPress={async () => {
              const res = await appApi.admin.orderDelivered({ order });
              if (!res?.success) {
                return;
              }
              updateOrder(order.id, "delivered");
            }}
          >
            {t("ordersPage:actions.deliveredOrder")}
          </Button>
        </>
      );
    }

    if (order.status === "delivered") {
      if (store?.paymentType === "external") {
        return (
          <Button
            onPress={async () => {
              // charge for order
              const res = await appApi.admin.endOrder({ order });
              if (!res?.success) {
                return;
              }
              updateOrder(order.id, "completed");
            }}
          >
            {t("ordersPage:actions.endOrder")}
          </Button>
        );
      }
      // todo fixthis
      if (order.paymentStatus === "pending_j5") {
        return (
          <>
            <Button
              onPress={async () => {
                const res = await appApi.admin.chargeOrder({ order });
                if (!res?.success) return;
                updateOrder(order.id, "completed");
              }}
            >
              {t("ordersPage:actions.chargeOrder")}
            </Button>
          </>
        );
      }
    }
    if (order.status === "processing") {
      return (
        <>
          <Button
            variant="primary"
            onPress={async () => {
              const res = await appApi.admin.orderInDelivery({ order });
              if (!res?.success) {
                return;
              }
              updateOrder(order.id, "in_delivery");
            }}
          >
            {t("ordersPage:actions.setOnDelivery")}
          </Button>
          <Button
            onPress={() => {
              cancelOverlay.open();
            }}
            type="button"
          >
            {t("ordersPage:actions.cancelOrder")}
          </Button>
        </>
      );
    }

    if (order.status === "pending") {
      return (
        <>
          <Button
            type="button"
            onPress={async () => {
              const payment = await appApi.user.createPaymentLink({ order });
              if (payment?.data?.formAction && payment?.data?.formFields) {
                submitHypForm(payment.data.formAction, payment.data.formFields);
              } else if (payment?.data?.paymentLink) {
                window.location.href = payment.data.paymentLink;
              }
            }}
          >
            צור לינק חיוב
          </Button>
          <Button
            type="button"
            onPress={async () => {
              const res = await appApi.admin.orderAccept({ order });
              if (!res?.success) {
                return;
              }
              updateOrder(order.id, "processing");
            }}
          >
            {t("ordersPage:actions.acceptOrder")}
          </Button>
          <Button
            onPress={() => {
              cancelOverlay.open();
            }}
            type="button"
          >
            {t("ordersPage:actions.cancelOrder")}
          </Button>
        </>
      );
    }

    return null;
  }

  return (
    <div key={order.id} className="flex flex-wrap items-center gap-y-4 gap-x-4 py-6">
      <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
        <dt className="text-base font-medium text-gray-500 dark:text-gray-400">
          {t("ordersPage:columns.orderId")}
        </dt>
        <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
          <a href="#" className="hover:underline">
            {order.id}
          </a>
        </dd>
      </dl>
      <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
        <dt className="text-base font-medium text-gray-500 dark:text-gray-400">
          {t("ordersPage:columns.client")}
        </dt>
        <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
          <a href="#" className="hover:underline">
            {order.client?.displayName}
            <br />({order.client?.phoneNumber})
          </a>
        </dd>
      </dl>
      <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
        <dt className="text-base font-medium text-gray-500 dark:text-gray-400">
          {t("ordersPage:columns.date")}
        </dt>
        <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
          <DateView date={order.date} />
        </dd>
      </dl>
      <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
        <dt className="text-base font-medium text-gray-500 dark:text-gray-400">
          {t("ordersPage:columns.sum")}
        </dt>
        <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
          <Price price={order.cart.cartTotal} />
        </dd>
      </dl>
      <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
        <dt className="text-base font-medium text-gray-500 dark:text-gray-400">payment</dt>
        <dd className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white">
          {order.paymentStatus}
        </dd>
      </dl>
      <dl className="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
        <dt className="text-base font-medium text-gray-500 dark:text-gray-400">
          {t("ordersPage:columns.status")}
        </dt>
        <dd className="mt-1.5 inline-flex items-center">
          <Chip color={chipColors[order.status]}>
            <Chip.Label>{t(`common:orderStatutes.${order.status}`)}</Chip.Label>
          </Chip>
        </dd>
      </dl>
      <div className="w-full grid sm:grid-cols-2 lg:flex lg:w-64 lg:items-center gap-4">
        {orderMainAction()}
      </div>
      <div className="w-full grid sm:grid-cols-2 lg:flex lg:w-64 lg:items-center lg:justify-end gap-4">
        <Button
          variant="primary"
          onPress={() => {
            modalApi.openModal("orderDetails", { order, onUpdated: updateOrder });
          }}
        >
          {t("ordersPage:actions.viewOrder")}
        </Button>
        {order.status !== "cancelled" && order.status !== "completed" && (
          <Button
            variant="primary"
            onPress={async () => {
              // complete order
              const res = await appApi.admin.endOrder({ order });
              if (!res?.success) {
                return;
              }
              updateOrder(order.id, "completed");
            }}
          >
            {t("ordersPage:actions.endOrder")}
          </Button>
        )}
      </div>
      <Modal isOpen={cancelOverlay.isOpen} onOpenChange={cancelOverlay.setOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>
                  {t("ordersPage:confirmCancel.title", "Cancel order")}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>
                  {t(
                    "ordersPage:confirmCancel.message",
                    "Are you sure you want to cancel this order?",
                  )}
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={cancelOverlay.close}>
                  {t("common:actions.cancel", "Close")}
                </Button>
                <Button variant="danger" onPress={confirmCancelOrder}>
                  {t("ordersPage:actions.cancelOrder")}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

export default AdminOrdersPages;
