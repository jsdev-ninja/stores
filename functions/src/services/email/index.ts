import { Resend } from "resend";

const resend = new Resend("re_5QmkymZm_zfaxB8R8LvptFfjg5BCHX6DM");

class EmailService {
	async sendEmail({ html }: any) {
		const res = await resend.emails.send({
			from: "onboarding@resend.dev",
			to: "philip@jsdev.ninja",
			subject: "Hello World",
			html: html,
		});

		return res;
	}
}

export const emailService = new EmailService();
