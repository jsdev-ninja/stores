import { useLayoutEffect, useState } from "react";
import "./style.css";
import { LoginForm } from "../LoginForm";
import { useTranslation } from "react-i18next";
import { SignupForm } from "./SignupForm";

export const AuthLayout = () => {
	const { i18n } = useTranslation();
	const dir = i18n.dir();
	const [x, setX] = useState(false);

	console.log("dir", dir);

	useLayoutEffect(() => {
		document.getElementById("container")?.style.setProperty("--dir", dir == "ltr" ? "1" : "-1");
	}, []);

	return (
		<div className={`container ${x && "right-panel-active"}`} id="container">
			<div className="form-container sign-up-container">
				<SignupForm />
			</div>
			<div className="form-container sign-in-container">
				<LoginForm />
			</div>
			<div className="overlay-container" id="overlayCon">
				<div className="overlay">
					<div className="overlay-panel overlay-left">
						<h1>Welcome Back!</h1>
						<p>To keep connected with us please login with your personal info</p>
						<button id="overlayBtn" onClick={() => setX(!x)}>
							Sign In
						</button>
					</div>
					<div className="overlay-panel overlay-right">
						<h1>Hello, Friend!</h1>
						<p>Enter your personal details and start journey with us</p>
						<button id="overlayBtn" onClick={() => setX(!x)}>
							Sign Up
						</button>{" "}
					</div>
				</div>
			</div>
		</div>
	);
};
