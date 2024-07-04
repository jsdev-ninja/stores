import { useState } from "react";
import "./style.css";

export const AuthLayout = () => {
	const [x, setX] = useState(false);
	return (
		<div
			className={`container ${x && "right-panel-active"}`}
			style={{ direction: "ltr" }}
			id="container"
		>
			<div className="form-container sign-up-container">
				<form action="#">
					<h1>Create Account</h1>
					<div className="social-container">
						<a href="#" className="social">
							<i className="fab fa-facebook-f"></i>
						</a>
						<a href="#" className="social">
							<i className="fab fa-google-plus-g"></i>
						</a>
						<a href="#" className="social">
							<i className="fab fa-linkedin-in"></i>
						</a>
					</div>
					<span>or use your email for registration</span>
					<div className="infield">
						<input type="text" placeholder="Name" />
						<label></label>
					</div>
					<div className="infield">
						<input type="email" placeholder="Email" name="email" />
						<label></label>
					</div>
					<div className="infield">
						<input type="password" placeholder="Password" />
						<label></label>
					</div>
					<button>Sign Up</button>
				</form>
			</div>
			<div className="form-container sign-in-container">
				<form action="#">
					<h1>Sign in</h1>
					<div className="social-container">
						<a href="#" className="social">
							<i className="fab fa-facebook-f"></i>
						</a>
						<a href="#" className="social">
							<i className="fab fa-google-plus-g"></i>
						</a>
						<a href="#" className="social">
							<i className="fab fa-linkedin-in"></i>
						</a>
					</div>
					<span>or use your account</span>
					<div className="infield">
						<input type="email" placeholder="Email" name="email" />
						<label></label>
					</div>
					<div className="infield">
						<input type="password" placeholder="Password" />
						<label></label>
					</div>
					<a href="#" className="forgot">
						Forgot your password?
					</a>
					<button>Sign In</button>
				</form>
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
