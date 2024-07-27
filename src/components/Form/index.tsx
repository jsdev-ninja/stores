/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
import { DefaultValues, FieldValues, FormProvider, UseFormReturn, useForm } from "react-hook-form";
import type { ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select } from "./Select";
import { Checkbox } from "./Checkbox";
import { FileInput } from "./FileInput";
import { Input } from "./Input";
import { Submit } from "./Submit";
import { ErrorMessage, GlobalError } from "./ErrorMessage";
import { Field } from "./Field";
import { Locales } from "./Locales";

type Props<T extends FieldValues> = {
	schema: ZodSchema;
	children: ReactNode;
	onSubmit: (data: T, form: UseFormReturn) => void;
	defaultValues?: DefaultValues<T>;
	className?: string;
};

export function Form<T extends FieldValues>(props: Props<T>) {
	const { children, schema, onSubmit, defaultValues, className } = props;

	const form = useForm({
		resolver: schema && zodResolver(schema),
		defaultValues,
	});

	console.log("form", form.getValues());

	console.log("error", form.formState.errors);

	return (
		<FormProvider<T> {...form}>
			<form
				onSubmit={form.handleSubmit((data) => onSubmit(data, form as any))}
				className={className}
			>
				{children}
			</form>
		</FormProvider>
	);
}

Form.Input = Input;
Form.ErrorMessage = ErrorMessage;
Form.Checkbox = Checkbox;
Form.Select = Select;
Form.File = FileInput;
Form.GlobalError = GlobalError;
Form.Field = Field;
Form.Submit = Submit;
Form.Locales = Locales;
