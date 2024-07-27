import { Form } from "src/components/Form";
import { Modal } from "src/components/Modal/Modal";
import { BaseCategorySchema, TCategory } from "src/domains/Category";
import { useAppSelector } from "src/infra";
import { modalApi } from "src/infra/modals";
import { flatten } from "src/utils";

export function CategoryFormModal({ categoryId }: { categoryId: string }) {
	const categories = useAppSelector((state) => state.category.categories);

	const flattenCategory = flatten(categories);

	const category = flattenCategory.find((c) => c.id === categoryId);

	console.log("category", category);

	if (!category) {
	}

	return (
		<Modal>
			<Modal.CloseButton onClick={() => modalApi.closeModal("categoryFormModal")} />
			<div className="p-4">
				<div className="">
					<Modal.Title>Edit Category</Modal.Title>
				</div>
				<div className="">
					<Form<Omit<TCategory, "children">>
						schema={BaseCategorySchema}
						onSubmit={(data) => {
							console.log("data", data);
						}}
					>
						<Form.Input<TCategory> name="tag" placeholder="tag" label="tag" />
					</Form>
				</div>
			</div>
		</Modal>
	);
}
