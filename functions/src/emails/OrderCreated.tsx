import { Img, Html, Container, Text, Row, Column, Head, Section } from "@react-email/components";
import * as React from "react";
import { TOrder } from "@jsdev_ninja/core";

const content = {
	title_client: "התקבלה הזמנה חדשה",
} as const;

type Props = {
	order: TOrder;
};

function OrderCreated({ order }: Props) {
	if (!order) return null;

	const { apartmentNumber, city, floor, street, streetNumber } = order.address;

	const fullAdress = `${city}, ${street} ${streetNumber} קומה ${floor}, דירה ${apartmentNumber}`;
	return (
		<Html dir="rtl" lang="he" style={{ textAlign: "right" }}>
			<Head>
				<title>{content.title_client}</title>
			</Head>
			<Container dir="rtl">
				<Text style={{ textAlign: "center", fontSize: 24, fontWeight: "bold" }}>
					{content.title_client}
				</Text>
				{order.cart.items.map((item, i) => {
					return (
						<Row key={i}>
							<Column>
								<Img
									src={item.product.images?.[0]?.url ?? ""}
									alt="product"
									width="50"
									height="50"
								/>
							</Column>
							<Column>{item.product.name[0].value}</Column>
							<Column>
								{item.product.price} * {item.amount}
							</Column>
							<Column>{Number(item.product.price * item.amount).toFixed(2)}</Column>
						</Row>
					);
				})}

				<Row style={{ marginBlock: 40 }}>
					<Column>שם: {order.client.displayName}</Column>
					<Column>כתובת: {fullAdress}</Column>
				</Row>

				<Row style={{ marginBlock: 40 }}>
					<Column> סהכ {order.cart.cartTotal}</Column>
					<Column> מעם {order.cart.cartVat}</Column>
					<Column> הנחה {order.cart.cartDiscount}</Column>
				</Row>
			</Container>
		</Html>
	);
}

export default OrderCreated;
