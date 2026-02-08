import { Resend } from "resend";

const resend = new Resend("re_F3H4Tm8h_Q8m7N31uJKDSuL56ENkHL6C8");

class EmailService {
	async sendEmail({ html, email, subject = "new order created" }: { html: string; email: string; subject?: string }) {
		const res = await resend.emails.send({
			from: "philip@jsdev.ninja",
			to: email,
			subject,
			html,
		});

		return res;
	}
}

export const emailService = new EmailService();
