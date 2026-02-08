import { Html, Container, Text, Head } from "@react-email/components";
import * as React from "react";

const content = {
	title: "טופס צור קשר חדש התקבל",
} as const;

export type TContactSubmission = {
	name: string;
	email: string;
	company: string;
	phone?: string;
	message?: string;
	createdAt: number;
};

type Props = {
	submission: TContactSubmission;
};

function ContactFormSubmitted({ submission }: Props) {
	if (!submission) return null;

	const { name, email, company, phone, message } = submission;

	return (
		<Html dir="rtl" lang="he" style={{ textAlign: "right" }}>
			<Head>
				<title>{content.title}</title>
			</Head>
			<Container dir="rtl">
				<Text style={{ textAlign: "center", fontSize: 24, fontWeight: "bold" }}>
					{content.title}
				</Text>
				<Text style={{ marginTop: 24 }}>
					<strong>שם:</strong> {name}
				</Text>
				<Text>
					<strong>אימייל:</strong> {email}
				</Text>
				<Text>
					<strong>חברה / ארגון:</strong> {company}
				</Text>
				{phone ? (
					<Text>
						<strong>טלפון:</strong> {phone}
					</Text>
				) : null}
				{message ? (
					<Text style={{ marginTop: 16 }}>
						<strong>הודעה:</strong>
						<br />
						{message}
					</Text>
				) : null}
			</Container>
		</Html>
	);
}

export default ContactFormSubmitted;
