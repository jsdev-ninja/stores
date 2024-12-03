"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const resend_1 = require("resend");
const resend = new resend_1.Resend("re_5QmkymZm_zfaxB8R8LvptFfjg5BCHX6DM");
class EmailService {
    async sendEmail({ html }) {
        const res = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: "philip@jsdev.ninja",
            subject: "Hello World",
            html: html,
        });
        return res;
    }
}
exports.emailService = new EmailService();
//# sourceMappingURL=index.js.map