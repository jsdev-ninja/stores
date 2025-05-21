import React from "react";
import { Card, CardBody, CardHeader, Link } from "@heroui/react";
// import { Icon } from "@iconify/react";
import gsap from "gsap";

import { FirebaseError } from "firebase/app";
import { useTranslation } from "react-i18next";
// import { Icon } from "src/components";
import { Form } from "src/components/Form";
import { i18n, useStoreActions } from "src/infra";
import { modalApi } from "src/infra/modals";
import { FirebaseApi } from "src/lib/firebase";
import { z } from "zod";
import { Icon } from "src/components";
import { navigate } from "src/navigation";

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

export const LoginForm = ({ changeForm }: { changeForm: () => void }) => {
	const formRef = React.useRef<HTMLDivElement>(null);

	const actions = useStoreActions();

	const { t } = useTranslation(["common", "auth"]);

	React.useEffect(() => {
		if (formRef.current) {
			gsap.fromTo(
				formRef.current,
				{ y: 20, opacity: 0 },
				{ y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
			);
		}
	}, []);

	return (
		<div className="min-h-[80vh] w-full flex items-center justify-center px-4 py-12">
			<div ref={formRef} className="w-full max-w-md">
				<Card className="w-full">
					<div className="absolute top-2 end-2 z-50">
						<Icon
							name="close"
							onClick={() => {
								modalApi.closeModal("authModal");
							}}
						/>
					</div>
					<CardHeader className="flex flex-col gap-1 items-center">
						<h1 className="text-2xl font-bold">{t("login")}</h1>
						<p className="text-foreground-500">התחבר לחשבון שלך</p>
					</CardHeader>
					<CardBody>
						<Form<z.infer<typeof loginSchema>>
							schema={loginSchema}
							onSubmit={async (data, form) => {
								const result = await FirebaseApi.auth.login(data.email, data.password);
								if (!result.success) {
									form.setError("global", { message: getError(result) });
									return;
								}
								if (result.success) {
									const { user } = result;
									actions.dispatch(actions.user.setUser(user));
									modalApi.closeModal("authModal");

									if (user?.admin) {
										navigate({
											to: "admin",
										});
									}
									return;
								}
							}}
							className="flex flex-col gap-4 h-full"
						>
							<Form.Input<TLoginForm>
								name="email"
								label={t("auth:form.email.label")}
								placeholder={t("auth:form.email.placeholder")}
							/>

							<Form.Input
								name="password"
								type="password"
								label={t("auth:form.password.label")}
								placeholder={t("auth:form.password.placeholder")}
							/>

							<div className="my-4">
								<Form.GlobalError />
							</div>
							<div className="mt-auto">
								<Form.Submit fullWidth>כניסה</Form.Submit>
							</div>
						</Form>

						<p className="text-center mt-6 text-sm">
							איך לך עדיין חשבון?{" "}
							<Link onPress={changeForm} className="text-primary hover:underline">
								הירשם
							</Link>
						</p>
					</CardBody>
				</Card>
			</div>
		</div>
	);
};
