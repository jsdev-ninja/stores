import { Form } from "src/components/Form";
import { FirebaseApi } from "src/lib/firebase";
import { navigate } from "src/navigation";

export function AddCategoryPage() {
	return (
		<div className="">
			<div className="flex flex-col gap-4 w-[500px] mx-auto mt-10 shadow p-4">
				<Form
					// schema={NewProductSchema}
					onSubmit={async (data: any) => {
						console.log("WORK", data);
						navigate("admin.categories");
						const res = await FirebaseApi.firestore.create(
							{ ...data },
							FirebaseApi.firestore.collections.categories
						);
						console.log("res", res);
					}}
					defaultValues={{}}
				>
					<div className="my-4">
						<Form.Input name="name" label="Name" placeholder="Enter Category name" />
					</div>

					<div className="my-4">
						<Form.Submit>Add Category</Form.Submit>
					</div>
				</Form>
			</div>
		</div>
	);
}
