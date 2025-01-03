"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const brevo_1 = require("@getbrevo/brevo");
class EmailService extends brevo_1.TransactionalEmailsApi {
    getAuthentications() {
        return this.authentications;
    }
    sendEmail() {
        const sendSmtpEmail = {};
        sendSmtpEmail.subject = "My {{params.subject}}";
        sendSmtpEmail.htmlContent =
            "<html><body><h1>Common: This is my first {{params.parameter}}</h1></body></html>";
        sendSmtpEmail.sender = { name: "John", email: "philip@jsdev.ninja" };
        sendSmtpEmail.to = [{ email: "philipbrodovsky@gmail.com", name: "shubham upadhyay" }];
        sendSmtpEmail.replyTo = {
            email: "shubham.upadhyay@sendinblue.com",
            name: "Shubham Upadhyay",
        };
        sendSmtpEmail.params = { parameter: "My param value", subject: "common subject" };
        return apiInstance.sendTransacEmail(sendSmtpEmail).then((data) => {
            console.log("API called successfully. Returned data: " + JSON.stringify(data));
        }, (error) => {
            console.error(error);
        });
    }
}
const apiInstance = new EmailService();
const auth = apiInstance.getAuthentications();
const apiKey = auth["apiKey"];
// todo use secrets
apiKey.apiKey =
    "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";
exports.emailService = new EmailService();
//# sourceMappingURL=index.js.map