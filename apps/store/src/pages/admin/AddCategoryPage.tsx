import { useAppApi } from "src/appApi";
import { Form } from "src/components/Form";
import { TCategory } from "@jsdev_ninja/core";

import { useStore } from "src/domains/Store";
import { navigate } from "src/navigation";
import { z } from "zod";
import { useTranslation } from "react-i18next";

export function AddCategoryPage() {
	const store = useStore();

	const appApi = useAppApi();

	const { t } = useTranslation(["common", "admin"]);

	return (
		<div className="">
			<div className="flex flex-col gap-4 w-[500px] mx-auto mt-10 shadow p-4">
				<Form
					schema={z.object({
						name: z.string().nonempty({ message: "שדה חובה" }),
					})}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					onSubmit={async (data: any) => {
						if (!store?.id || !store.companyId) return;

						const newCategory: TCategory = {
							children: [],
							companyId: store.companyId,
							id: crypto.randomUUID(),
							locales: [{ lang: "he", value: data.name }],
							storeId: store.id,
							parentId: "",
							depth: 0,
						};

						await appApi.admin.category.create(newCategory);
						navigate({
							to: "admin.categories",
						});
					}}
					defaultValues={{}}
				>
					<div className="my-4">
						<Form.Input name="name" label="Name" placeholder="Enter Category name" />
					</div>

					<div className="my-4">
						<Form.Submit isLoading={appApi.loading["admin.category.create"]}>
							{t("admin:createCategory")}
						</Form.Submit>
					</div>
				</Form>
			</div>
		</div>
	);
}
