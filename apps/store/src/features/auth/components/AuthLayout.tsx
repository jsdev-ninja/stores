import { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SignupForm } from "./SignupForm";
import { LoginForm } from "./LoginForm";

export const AuthLayout = () => {
	const { i18n } = useTranslation(["auth"]);
	const dir = i18n.dir();
	const [isLoginForm, setIsLoginForm] = useState(true);

	// const title = isLoginForm ? t("auth:welcome.login.title") : t("welcome.signup.title");
	// const button = isLoginForm ? t("auth:welcome.login.button") : t("welcome.signup.button");
	// const description = isLoginForm
	// 	? t("auth:welcome.login.description")
	// 	: t("welcome.signup.description");

	useLayoutEffect(() => {
		document.getElementById("container")?.style.setProperty("--dir", dir == "ltr" ? "1" : "-1");
	}, []);

	if (isLoginForm) {
		return <LoginForm changeForm={() => setIsLoginForm(false)} />;
	}
	return <SignupForm changeForm={() => setIsLoginForm(true)} />;
};
