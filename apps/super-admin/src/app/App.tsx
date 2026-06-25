import { BrowserRouter } from "react-router-dom";
import { AuthGate } from "src/auth/AuthGate";
import { StoreProvider } from "src/store-context/StoreProvider";
import { AppRoutes } from "./routes";

export function App() {
	return (
		<BrowserRouter>
			<AuthGate>
				<StoreProvider>
					<AppRoutes />
				</StoreProvider>
			</AuthGate>
		</BrowserRouter>
	);
}
