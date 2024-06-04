import ReactDOM from "react-dom/client";
import "./index.css";
import "./infra/index.ts";
import App from "./app/App.tsx";
import { Provider } from "react-redux";
import { store } from "./infra/index.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
	<Provider store={store}>
		<App />
	</Provider>
);
