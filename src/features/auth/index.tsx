import { Form } from "src/components/Form";
import { Modal } from "src/components/Modal/Modal";
import { FirebaseApi } from "src/lib/firebase";
import { z } from "zod";

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});
export function AuthModal() {
	return (
		<Modal>
			<Modal.Title>Login</Modal.Title>

			<Form
				schema={loginSchema}
				onSubmit={(data) => {
					console.log("data", data);
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