import { Form } from "src/components/Form";
import { Modal } from "src/components/Modal/Modal";
import { useStoreActions } from "src/infra";
import { modalApi } from "src/infra/modals";
import { FirebaseApi } from "src/lib/firebase";
import { z } from "zod";

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});
export function AuthModal() {
	const actions = useStoreActions();
	return (
		<Modal>
			<Modal.CloseButton onClick={() => modalApi.closeModal("authModal")} />
			<Modal.Title>Login</Modal.Title>

			<Form<z.infer<typeof loginSchema>>
				schema={loginSchema}
				onSubmit={async (data) => {
					const result = await FirebaseApi.auth.login(data.email, data.password);
					if (result.success) {
						actions.dispatch(actions.user.setUser(result.user));
						modalApi.closeModal("authModal");
						return;
					}
				}}
			>
				<Form.Input name="email" />
				<Form.Input name="password" />
				<Form.Submit fullWidth>Login</Form.Submit>
			</Form>
		</Modal>
	);
}
