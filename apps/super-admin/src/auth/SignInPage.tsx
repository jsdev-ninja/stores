import { Button, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { useSignInPage } from "./useSignInPage";

export function SignInPage() {
	const { register, errors, isSubmitting, serverError, handleSubmit } = useSignInPage();

	return (
		<div className="min-h-screen bg-slate-100 flex items-center justify-center">
			<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 w-full max-w-md">
				<p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
					Internal Tool
				</p>
				<h1 className="text-2xl font-bold text-slate-900 mb-8">
					Super-Admin Console
				</h1>

				<Form
					className="flex flex-col gap-5"
					validationBehavior="aria"
					onSubmit={handleSubmit}
				>
					<TextField
						fullWidth
						isInvalid={!!errors.email}
						name="email"
						type="email"
					>
						<Label>Email</Label>
						<Input
							placeholder="admin@example.com"
							{...register("email")}
						/>
						{errors.email && (
							<FieldError>{errors.email.message}</FieldError>
						)}
					</TextField>

					<TextField
						fullWidth
						isInvalid={!!errors.password}
						name="password"
						type="password"
					>
						<Label>Password</Label>
						<Input
							placeholder="••••••••"
							{...register("password")}
						/>
						{errors.password && (
							<FieldError>{errors.password.message}</FieldError>
						)}
					</TextField>

					{serverError && (
						<p className="text-sm text-red-600 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
							{serverError}
						</p>
					)}

					<Button
						fullWidth
						isPending={isSubmitting}
						type="submit"
					>
						{({ isPending }) =>
							isPending ? "Signing in…" : "Sign in"
						}
					</Button>
				</Form>
			</div>
		</div>
	);
}
