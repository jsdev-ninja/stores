import { Form } from "src/components/Form";
import { Modal } from "src/components/Modal/Modal";
import { modalApi } from "src/infra/modals";
import { FirebaseApi } from "src/lib/firebase";
import { z } from "zod";

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});
export function AuthModal() {
	return (
		<Modal>
			<Modal.CloseButton onClick={() => modalApi.closeModal("authModal")} />
			<Modal.Title>Login</Modal.Title>

			<Form
				schema={loginSchema}
				onSubmit={(data) => {
					FirebaseApi.auth.login(data.email, data.password);
				}}
			>
				<Form.Input name="email" />
				<Form.Input name="password" />
				<Form.Submit fullWidth>Login</Form.Submit>
			</Form>
		</Modal>
	);
}
