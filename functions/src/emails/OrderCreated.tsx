import { Img, Html, Container, Text, Row, Column } from "@react-email/components";
import * as React from "react";
import { TOrder } from "@jsdev_ninja/core";

const content = {
	title_client: "הזמנה שלך התקבלה בהצלחה",
} as const;

type Props = {
	order: TOrder;
};

function OrderCreated({ order }: Props) {
	if (!order) return null;
	return (
		<Html dir="rtl" lang="he">
			<Container>
				<Text style={{ textAlign: "center" }}>{content.title_client}</Text>
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
			</Container>
		</Html>
	);
}

export default OrderCreated;
