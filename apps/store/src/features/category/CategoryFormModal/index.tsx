import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { Form } from "src/components/Form";
import { Modal } from "src/components/Modal/Modal";
import { TCategory, CategorySchema } from "@jsdev_ninja/core";
import { modalApi } from "src/infra/modals";
import { flatten } from "src/utils";
import { buildTree } from "src/widgets/Category/CategoryTree/utils";
import { useEffect, useState } from "react";

export function CategoryFormModal({ categoryId, onSave }: { categoryId: string; onSave?: any }) {
	const appApi = useAppApi();

	const [categories, setCategories] = useState<TCategory[]>([]);

	const flattenCategory = flatten(categories);

	const category = flattenCategory.find((c) => c.id === categoryId);

	useEffect(() => {
		appApi.system.getStoreCategories().then((res) => {
			setCategories(res?.data?.categories ?? []);
		});
	}, []);

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
					await appApi.admin.category.update(buildTree(newCategories as any), categories);
					onSave?.(buildTree(newCategories as any));
					modalApi.closeModal("categoryFormModal");
				}}
				onError={() => {}}
			>
				<Modal.CloseButton onClick={() => modalApi.closeModal("categoryFormModal")} />
				<div className="p-4 w-96 bg-white">
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
					</div>
					<div className="flex items-center justify-between mt-8 mb-4">
						<Button onPress={() => modalApi.closeModal("categoryFormModal")}>Cancel</Button>
						<Form.Submit>Save</Form.Submit>
					</div>
				</div>
			</Form>
		</Modal>
	);
}
