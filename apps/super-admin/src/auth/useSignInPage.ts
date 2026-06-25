import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Auth } from "src/lib/firebase/auth";

const SignInSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

type SignInFields = z.infer<typeof SignInSchema>;

export function useSignInPage() {
	const [serverError, setServerError] = useState<string | null>(null);

	const methods = useForm<SignInFields>({
		resolver: zodResolver(SignInSchema),
		defaultValues: { email: "", password: "" },
	});

	const handleSubmit = methods.handleSubmit(async (values) => {
		setServerError(null);
		try {
			await Auth.signIn(values.email, values.password);
			// Auth state change is handled by useSuperAdminClaim listener —
			// no manual redirect needed; AuthGate re-evaluates on user change.
		} catch {
			setServerError("Invalid email or password. Please try again.");
		}
	});

	return {
		register: methods.register,
		errors: methods.formState.errors,
		isSubmitting: methods.formState.isSubmitting,
		serverError,
		handleSubmit,
	};
}
