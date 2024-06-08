/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import type { ZodSchema } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select } from "./Select";
import { Checkbox } from "./Checkbox";
import { FileInput } from "./FileInput";
import { Input } from "./Input";
import { Submit } from "./Submit";

type Props<T> = {
	children: ReactNode;
	onSubmit: (data: any) => void;
	schema: T & ZodSchema;
	defaultValues?: z.infer<Props<T>["schema"]>;
};

export function Form(props: Props<any>) {
	const { children, schema, onSubmit, defaultValues } = props;

	const form = useForm({
		resolver: schema && zodResolver(schema),
		defaultValues,
	});

	return (
		<FormProvider {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="">
				{children}
			</form>
		</FormProvider>
	);
}

Form.Input = Input;

Form.Checkbox = Checkbox;
Form.Select = Select;
Form.File = FileInput;

Form.Submit = Submit;
