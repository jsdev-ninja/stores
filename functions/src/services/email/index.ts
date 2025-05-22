import { Resend } from "resend";

const resend = new Resend("re_F3H4Tm8h_Q8m7N31uJKDSuL56ENkHL6C8");

class EmailService {
	async sendEmail({ html, email }: any) {
		const res = await resend.emails.send({
			// todo
			from: "philip@jsdev.ninja",
			to: email,
			subject: "new order created",
			html: html,
		});

		return res;
	}
}

export const emailService = new EmailService();
