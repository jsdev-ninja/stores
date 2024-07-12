import { FirebaseError } from "firebase/app";
import { useTranslation } from "react-i18next";
import { Icon } from "src/components";
import { Form } from "src/components/Form";
import { Modal } from "src/components/Modal/Modal";
import { i18n, useStoreActions } from "src/infra";
import { modalApi } from "src/infra/modals";
import { FirebaseApi } from "src/lib/firebase";
import { z } from "zod";

function getError(error: unknown) {
	if (error instanceof FirebaseError) {
		if (error.code === "auth/invalid-credential") {
			return i18n.t("auth:form.errors.codes.auth/invalid-credential");
		}
		return "global";
	}

	return "global";
}
const loginSchema = z.object({
	email: z.string().email({ message: i18n.t("auth:form.errors.invalidEmail") }),
	password: z.string({}).min(1, {}),
});

type TLoginForm = z.infer<typeof loginSchema>;

export function SignupForm() {
	const actions = useStoreActions();

	const { t } = useTranslation(["common", "auth"]);

	return (
		<Form<z.infer<typeof loginSchema>>
			schema={loginSchema}
			onSubmit={async (data, form) => {
				const result = await FirebaseApi.auth.createUser(data.email, data.password);
				if (!result.success) {
					form.setError("global", { message: getError(result.error) });
					return;
				}
				if (result.success) {
					actions.dispatch(actions.user.setUser(result.user));
					modalApi.closeModal("authModal");
					return;
				}
			}}
			className="flex flex-col gap-4 h-full"
		>
			<div className="absolute top-2 end-2 z-10">
				<Icon
					name="close"
					onClick={() => {
						modalApi.closeModal("authModal");
					}}
				/>
			</div>
			<div className="text-center">
				<Modal.Title>{t("login")}</Modal.Title>
			</div>
			<Form.Input<TLoginForm>
				name="email"
				label={t("auth:form.email.label")}
				placeholder={t("auth:form.email.placeholder")}
			/>
			<Form.ErrorMessage<TLoginForm> name={"email"} />

			<Form.Input
				name="password"
				type="password"
				label={t("auth:form.password.label")}
				placeholder={t("auth:form.password.placeholder")}
			/>
			<Form.ErrorMessage<TLoginForm> name={"password"} />

			<div className="my-4">
				<Form.GlobalError />
			</div>
			<div className="mt-auto">
				<Form.Submit fullWidth>הרשמה</Form.Submit>
			</div>
		</Form>
	);
}
