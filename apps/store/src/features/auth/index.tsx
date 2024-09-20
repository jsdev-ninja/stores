import { Modal } from "src/components/Modal/Modal";
import { AuthLayout } from "./components/AuthLayout";

export { ProtectedRoute } from "./ProtectedRoute/ProtectedRoute";

export function AuthModal() {
	return (
		<Modal>
			<AuthLayout />
		</Modal>
	);
}
