import ReactDOM from "react-dom/client";
import { CONFIG } from "./config/index.ts";
import "./infra/index.ts";
import App from "./app/App.tsx";
import { Provider } from "react-redux";
import { store } from "./infra/index.ts";
import { mixPanelApi } from "./lib/mixpanel/index.ts";
import { SentryApi } from "./lib/sentry/index.ts";
import "./index.css";

console.log("STORE_VERSION", process.env.VITE_STORE_VERSION);
console.log("STORE_VERSION2", import.meta.env.VITE_STORE_VERSION);

console.log("CONFIG", CONFIG);

mixPanelApi.init({ debug: CONFIG.DEV });
SentryApi.init();

ReactDOM.createRoot(document.getElementById("root")!).render(
	<Provider store={store}>
		<App />
	</Provider>
);
