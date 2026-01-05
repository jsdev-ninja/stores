import React, { useMemo } from "react";
import { Card, CardBody, CardHeader, Link } from "@heroui/react";
// import { Icon } from "@iconify/react";
import gsap from "gsap";
import { Form } from "src/components/Form";
import { z } from "zod";
import { FirebaseError } from "firebase/app";
import { useAppApi } from "src/appApi";
import { i18n, useStoreActions } from "src/infra";
import { useTranslation } from "react-i18next";
import { modalApi } from "src/infra/modals";
import { Icon } from "src/components";
import { useStore } from "src/domains/Store";

function getError(error: unknown) {
	if (error instanceof FirebaseError) {
		if (error.code === "auth/invalid-credential") {
			return i18n.t("auth:form.errors.codes.auth/invalid-credential");
		}
		return "global";
	}

	return "global";
}

export const SignupForm = ({ changeForm }: { changeForm: () => void }) => {
	const formRef = React.useRef<HTMLDivElement>(null);

	const actions = useStoreActions();

	const appApi = useAppApi();

	const store = useStore();

	const loginSchema = useMemo(() => {
		const isOnlyCompanyAlloew =
			store?.clientTypes?.includes("company") && store?.clientTypes?.length === 1;

		const loginSchema = z.object({
			fullName: z.string({}).min(1, {}),
			companyName: isOnlyCompanyAlloew
				? z.string({}).min(1, {})
				: z.string({}).min(1, {}).optional(),
			email: z.string().email({ message: i18n.t("auth:form.errors.invalidEmail") }),
			password: z.string({}).min(1, {}),
		});
		return loginSchema;
	}, [store]);

	type TLoginForm = z.infer<typeof loginSchema>;

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

	const isCompanyFlow = store?.clientTypes?.includes("company");

	console.log(store);

	if (!store) return null;

	return (
		<div className="min-h-[80vh] w-full flex items-center justify-center px-4 py-12">
			<div ref={formRef} className="w-full max-w-md">
				<Card className="w-full">
					<div className="absolute top-2 end-2 z-10">
						<Icon
							name="close"
							onClick={() => {
								modalApi.closeModal("authModal");
							}}
						/>
					</div>
					<CardHeader className="flex flex-col gap-1 items-center">
						<h1 className="text-2xl font-bold">הירשם</h1>
						<p className="text-foreground-500">צור את החשבון שלך היום</p>
					</CardHeader>
					<CardBody>
						<Form<z.infer<typeof loginSchema>>
							schema={loginSchema}
							onSubmit={async (data, form) => {
								const result = await appApi.auth.signup({
									email: data.email,
									fullName: data.fullName,
									password: data.password,
									companyName: data.companyName,
								});
								console.log("result", result);
								if (!result?.success) {
									form.setError("global", { message: getError(result) });
									return;
								}

								if (result?.success) {
									actions.dispatch(actions.user.setUser(result.user));
									modalApi.closeModal("authModal");
									return;
								}
							}}
							className="flex flex-col gap-4 h-full"
						>
							{!!isCompanyFlow && (
								<Form.Input<TLoginForm>
									name="companyName"
									type="text"
									label={t("common:companyName")}
									placeholder={t("common:companyName")}
								/>
							)}
							<Form.Input<TLoginForm>
								name="fullName"
								type="text"
								label={t("common:fullName")}
								placeholder={t("common:fullName")}
							/>
							<Form.Input<TLoginForm>
								name="email"
								label={t("auth:form.email.label")}
								placeholder={t("auth:form.email.placeholder")}
							/>

							<Form.Input<TLoginForm>
								name="password"
								type="password"
								label={t("auth:form.password.label")}
								placeholder={t("auth:form.password.placeholder")}
							/>

							<div className="my-4">
								<Form.GlobalError />
							</div>
							<div className="mt-auto">
								<Form.Submit fullWidth>הרשמה</Form.Submit>
							</div>
						</Form>

						<p className="text-center mt-6 text-sm">
							יש לך כבר חשבון{" "}
							<Link onPress={changeForm} className="text-primary hover:underline">
								תכנס כאן
							</Link>
						</p>
					</CardBody>
				</Card>
			</div>
		</div>
	);
};
