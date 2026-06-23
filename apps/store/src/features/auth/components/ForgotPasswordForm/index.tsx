import React from "react";
import { Card, Link } from "@heroui/react";
import gsap from "gsap";
import { useTranslation } from "react-i18next";
import { Form } from "src/components/Form";
import { i18n } from "src/infra";
import { modalApi } from "src/infra/modals";
import { z } from "zod";
import { Icon } from "src/components";
import { useAppApi } from "src/appApi";

const forgotPasswordSchema = z.object({
	email: z.string().email({ message: i18n.t("auth:form.errors.invalidEmail") }),
});

type TForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordForm = ({ changeForm }: { changeForm: () => void }) => {
	const formRef = React.useRef<HTMLDivElement>(null);
	const [isSent, setIsSent] = React.useState(false);

	const appApi = useAppApi();

	const { t } = useTranslation(["common", "auth"]);

	React.useEffect(() => {
		if (formRef.current) {
			gsap.fromTo(
				formRef.current,
				{ y: 20, opacity: 0 },
				{ y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
			);
		}
	}, [isSent]);

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
					<Card.Header className="flex flex-col gap-1 items-center">
						<Card.Title className="text-2xl font-bold">
							{t("auth:form.forgotPassword.title")}
						</Card.Title>
						{!isSent && (
							<p className="text-foreground-500 text-center">
								{t("auth:form.forgotPassword.description")}
							</p>
						)}
					</Card.Header>
					<Card.Content>
						{isSent ? (
							<div className="flex flex-col gap-6 items-center text-center py-4">
								<p className="text-foreground-600">
									{t("auth:form.forgotPassword.success")}
								</p>
								<Link
									onPress={changeForm}
									className="text-primary hover:underline"
								>
									{t("auth:form.forgotPassword.backToLogin")}
								</Link>
							</div>
						) : (
							<>
								<Form<TForgotPasswordForm>
									schema={forgotPasswordSchema}
									onSubmit={async (data) => {
										// Always show success to avoid revealing whether an
										// account exists (account-enumeration protection).
										await appApi.auth.resetPassword({ email: data.email });
										setIsSent(true);
									}}
									className="flex flex-col gap-4 h-full"
								>
									<Form.Input<TForgotPasswordForm>
										name="email"
										label={t("auth:form.email.label")}
										placeholder={t("auth:form.email.placeholder")}
									/>

									<div className="mt-auto">
										<Form.Submit fullWidth>
											{t("auth:form.forgotPassword.submit")}
										</Form.Submit>
									</div>
								</Form>

								<p className="text-center mt-6 text-sm">
									<Link
										onPress={changeForm}
										className="text-primary hover:underline"
									>
										{t("auth:form.forgotPassword.backToLogin")}
									</Link>
								</p>
							</>
						)}
					</Card.Content>
				</Card>
			</div>
		</div>
	);
};
