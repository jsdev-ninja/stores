import { Button, Html, Container, Text, Section, Row, Column } from "@react-email/components";
import * as React from "react";
import { OrderSchema } from "@jsdev_ninja/core";

const content = {
	title_client: "הזמנה שלך התקבלה בהצלחה",
} as const;

console.log(typeof OrderSchema);

type Props = {};
function OrderCreated({}: Props) {
	return (
		<Html dir="rtl" lang="he">
			<Container>
				<Text style={{ textAlign: "center" }}>{content.title_client}</Text>
				<Row>
					<Column>A</Column>
					<Column>A</Column>
					<Column>A</Column>
					<Column>A</Column>
					<Column>A</Column>
					<Column>A</Column>
					<Column>A</Column>
				</Row>
				<Row>
					<Column>B</Column>
				</Row>
				<Row>
					<Column>C</Column>
				</Row>
			</Container>
		</Html>
	);
}

export default OrderCreated;
