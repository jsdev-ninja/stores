import { Button } from "src/components/Button/Button";
import { Form } from "src/components/Form";
import { Modal } from "src/components/Modal/Modal";
import { CategorySchema, TCategory } from "src/domains/Category";
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
			<Form<Omit<TCategory, "children">>
				defaultValues={category}
				schema={CategorySchema}
				onSubmit={(data) => {
					console.log("data", data);
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
						<Button>Cancel</Button>
						<Form.Submit>Save</Form.Submit>
					</div>
				</div>
			</Form>
		</Modal>
	);
}
