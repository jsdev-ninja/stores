import { useAppApi } from "src/appApi";
import { Form } from "src/components/Form";
import { TCategory } from "src/domains/Category";
import { useStore } from "src/domains/Store";
import { navigate } from "src/navigation";
import { z } from "zod";

export function AddCategoryPage() {
	const store = useStore();

	const appApi = useAppApi();

	return (
		<div className="">
			<div className="flex flex-col gap-4 w-[500px] mx-auto mt-10 shadow p-4">
				<Form
					schema={z.object({
						name: z.string(),
						tag: z.string(),
					})}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					onSubmit={async (data: any) => {
						if (!store?.id || !store.companyId) return;

						const newCategory: TCategory = {
							children: [],
							companyId: store.companyId,
							id: crypto.randomUUID(),
							locales: [{ lang: "he", value: data.name }],
							tag: data.tag,
							storeId: store.id,
							parentId: "",
							depth: 0,
						};

						const res = await appApi.admin.category.create(newCategory);
						console.log("AddCategoryPage", res);
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
						<Form.Input name="tag" label="Tag" placeholder="Enter Category Tag" />
					</div>

					<div className="my-4">
						<Form.Submit>Add Category</Form.Submit>
					</div>
				</Form>
			</div>
		</div>
	);
}
