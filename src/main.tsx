import ReactDOM from "react-dom/client";
import "./index.css";
import "./infra/index.ts";
import App from "./app/App.tsx";
import { Provider } from "react-redux";
import { store } from "./infra/index.ts";
import { mixPanelApi } from "./lib/mixpanel/index.ts";
import { CONFIG } from "./config/index.ts";

console.log("CONFIG", CONFIG);

mixPanelApi.init({ debug: CONFIG.DEV });

ReactDOM.createRoot(document.getElementById("root")!).render(
	<Provider store={store}>
		<App />
	</Provider>
);
