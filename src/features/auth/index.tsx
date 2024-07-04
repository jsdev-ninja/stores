import { useState } from "react";
import { Button } from "src/components/Button/Button";
import { Form } from "src/components/Form";
import { Modal } from "src/components/Modal/Modal";
import { useStoreActions } from "src/infra";
import { modalApi } from "src/infra/modals";
import { FirebaseApi } from "src/lib/firebase";
import { z } from "zod";
import { AuthLayout } from "./components/AuthLayout";

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string(),
});
export function AuthModal() {
	const actions = useStoreActions();

	return (
		<Modal>
			<AuthLayout />
		</Modal>
	);
}
