import { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SignupForm } from "./SignupForm";
import { LoginForm } from "./LoginForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

type AuthView = "login" | "signup" | "forgotPassword";

export const AuthLayout = () => {
	const { i18n } = useTranslation(["auth"]);
	const dir = i18n.dir();
	const [view, setView] = useState<AuthView>("login");

	useLayoutEffect(() => {
		document.getElementById("container")?.style.setProperty("--dir", dir == "ltr" ? "1" : "-1");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (view === "signup") {
		return <SignupForm changeForm={() => setView("login")} />;
	}

	if (view === "forgotPassword") {
		return <ForgotPasswordForm changeForm={() => setView("login")} />;
	}

	return (
		<LoginForm
			changeForm={() => setView("signup")}
			onForgotPassword={() => setView("forgotPassword")}
		/>
	);
};
