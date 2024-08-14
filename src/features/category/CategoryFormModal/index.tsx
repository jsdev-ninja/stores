import { useAppApi } from "src/appApi";
import { Button } from "src/components/Button/Button";
import { Form } from "src/components/Form";
import { Modal } from "src/components/Modal/Modal";
import { CategorySchema, TCategory } from "src/domains/Category";
import { useAppSelector } from "src/infra";
import { modalApi } from "src/infra/modals";
import { flatten } from "src/utils";
import { buildTree } from "src/widgets/Category/CategoryTree/utils";

export function CategoryFormModal({ categoryId }: { categoryId: string }) {
	const appApi = useAppApi();

	const categories = useAppSelector((state) => state.category.categories);

	const flattenCategory = flatten(categories);

	const category = flattenCategory.find((c) => c.id === categoryId);

	if (!category) {
		return null;
	}

	const className = "my-4";

	return (
		<Modal>
			<Form<TCategory>
				defaultValues={category}
				schema={CategorySchema}
				onSubmit={async (data: TCategory) => {
					const newCategories = flattenCategory.map((c) => {
						if (c.id !== data.id) return c;
						return data;
					});
					await appApi.admin.category.update(buildTree(newCategories as any));
					modalApi.closeModal("categoryFormModal");
				}}
				onError={(errors) => {
					console.log("err", errors);
				}}
			>
				<Modal.CloseButton onClick={() => modalApi.closeModal("categoryFormModal")} />
				<div className="p-4 w-96">
					<div className="mb-6">
						<Modal.Title>Edit Category</Modal.Title>
					</div>
					<div className="">
						<div className={className}>
							<Form.Input<TCategory>
								name="locales[0].value"
								placeholder="name"
								label="Name"
							/>
						</div>
						<div className={className}>
							<Form.Input<TCategory> name="tag" placeholder="tag" label="tag" />
						</div>
					</div>
					<div className="flex items-center justify-between mt-8 mb-4">
						<Button onClick={() => modalApi.closeModal("categoryFormModal")}>Cancel</Button>
						<Form.Submit>Save</Form.Submit>
					</div>
				</div>
			</Form>
		</Modal>
	);
}
