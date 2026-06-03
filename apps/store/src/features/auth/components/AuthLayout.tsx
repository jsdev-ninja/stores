import { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SignupForm } from "./SignupForm";
import { LoginForm } from "./LoginForm";

export const AuthLayout = () => {
	const { i18n } = useTranslation(["auth"]);
	const dir = i18n.dir();
	const [isLoginForm, setIsLoginForm] = useState(true);

	useLayoutEffect(() => {
		document.getElementById("container")?.style.setProperty("--dir", dir == "ltr" ? "1" : "-1");
	}, []);

	if (isLoginForm) {
		return <LoginForm changeForm={() => setIsLoginForm(false)} />;
	}
	return <SignupForm changeForm={() => setIsLoginForm(true)} />;
};
