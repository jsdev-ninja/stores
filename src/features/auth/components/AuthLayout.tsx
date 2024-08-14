import { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SignupForm } from "./SignupForm";
import { LoginForm } from "./LoginForm";
import "./AuthLayout.css";

export const AuthLayout = () => {
	const { i18n, t } = useTranslation(["auth"]);
	const dir = i18n.dir();
	const [isLoginForm, setIsLoginForm] = useState(true);

	const title = isLoginForm ? t("auth:welcome.login.title") : t("welcome.signup.title");
	const button = isLoginForm ? t("auth:welcome.login.button") : t("welcome.signup.button");
	const description = isLoginForm
		? t("auth:welcome.login.description")
		: t("welcome.signup.description");

	useLayoutEffect(() => {
		document.getElementById("container")?.style.setProperty("--dir", dir == "ltr" ? "1" : "-1");
	}, []);

	return (
		<div className={`container ${!isLoginForm && "right-panel-active"}`} id="container">
			<div className="form-container sign-up-container">
				<SignupForm />
			</div>
			<div className="form-container sign-in-container">
				<LoginForm />
			</div>
			<div className="overlay-container" id="overlayCon">
				<div className="overlay">
					<div className="overlay-panel overlay-left">
						<h1>{title}</h1>
						<p>{description}</p>
						<button id="overlayBtn" onClick={() => setIsLoginForm(!isLoginForm)}>
							{button}
						</button>
					</div>
					<div className="overlay-panel overlay-right">
						<h1>{title}</h1>
						<p>{description}</p>
						<button id="overlayBtn" onClick={() => setIsLoginForm(!isLoginForm)}>
							{button}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
