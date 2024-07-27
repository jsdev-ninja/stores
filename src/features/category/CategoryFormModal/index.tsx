import { Button } from "src/components/Button/Button";
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
		return null;
	}

	const className = "my-4";

	return (
		<Modal>
			<Modal.CloseButton onClick={() => modalApi.closeModal("categoryFormModal")} />
			<div className="p-4 w-96">
				<div className="mb-6">
					<Modal.Title>Edit Category</Modal.Title>
				</div>
				<div className="">
					<Form<Omit<TCategory, "children">>
						defaultValues={category}
						schema={BaseCategorySchema}
						onSubmit={(data) => {
							console.log("data", data);
						}}
					>
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
					</Form>
				</div>
				<div className="flex items-center justify-between mt-8 mb-4">
					<Button>Cancel</Button>
					<Button>Save</Button>
				</div>
			</div>
		</Modal>
	);
}
