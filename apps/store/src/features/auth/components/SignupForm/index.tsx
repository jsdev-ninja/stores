import React, { useMemo } from "react";
import { Card, CardBody, CardHeader, Link } from "@heroui/react";
import gsap from "gsap";
import { Form } from "src/components/Form";
import { z } from "zod";
import { useAppApi } from "src/appApi";
import { i18n, useStoreActions } from "src/infra";
import { useTranslation } from "react-i18next";
import { modalApi } from "src/infra/modals";
import { Icon } from "src/components";
import { useStore } from "src/domains/Store";

type SignupErrorResult = { success: false; code: string; errMessage: string };

const EMAIL_FIELD_CODES = ["auth/invalid-email"] as const;
const PASSWORD_CODES = ["auth/weak-password"] as const;

const AUTH_CODE_KEYS: Record<string, string> = {
	"auth/invalid-email": "auth:form.errors.codes.auth/invalid-email",
	"auth/weak-password": "auth:form.errors.codes.auth/weak-password",
};

const GENERIC_ERROR_KEY = "auth:form.errors.codes.generic";

function getErrorMessage(code: string): string {
	const key = AUTH_CODE_KEYS[code] ?? GENERIC_ERROR_KEY;
	return i18n.t(key as "auth:form.errors.codes.generic");
}

function parseSignupError(result: unknown): { field?: "email" | "password"; message: string } | { root: string } {
	const r = result as SignupErrorResult | undefined;
	if (!r?.code) return { root: i18n.t(GENERIC_ERROR_KEY) };

	// Don't reveal that email exists (security: avoid account enumeration)
	if (r.code === "auth/email-already-in-use") {
		return { root: i18n.t(GENERIC_ERROR_KEY) };
	}

	const message = getErrorMessage(r.code);
	if (EMAIL_FIELD_CODES.includes(r.code as (typeof EMAIL_FIELD_CODES)[number])) return { field: "email", message };
	if (PASSWORD_CODES.includes(r.code as (typeof PASSWORD_CODES)[number])) return { field: "password", message };
	return { root: message };
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

	if (!store) return null;

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

								if (!result?.success) {
									form.clearErrors();
									const parsed = parseSignupError(result);
									if ("field" in parsed && parsed.field) {
										form.setError(parsed.field, { message: parsed.message });
									} else if ("root" in parsed) {
										form.setError("global", { message: parsed.root });
									}
									return;
								}

								if (result?.success) {
									actions.dispatch(actions.user.setUser(result.user));
									modalApi.closeModal("authModal");
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

							<div className="mt-auto flex flex-col gap-3">
								<Form.GlobalError />
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
