import { useEffect, useState } from "react";
import { Button } from "src/components/button";
import { TCategory } from "@jsdev_ninja/core";
import { navigate } from "src/navigation";
import { CategoryTree } from "src/widgets/Category/CategoryTree/CategoryTree";
import { isEqual } from "lodash";
import { useAppApi } from "src/appApi";

export function AdminCategoriesPages() {
	const appApi = useAppApi();
	const [categoriesToEdit, setCategoriesToEdit] = useState<TCategory[]>([]);

	useEffect(() => {
		appApi.system.getStoreCategories().then((res) => {
			setCategoriesToEdit(res?.data?.categories ?? []);
		});
	}, []);

	function addCategory() {
		return navigate({
			to: "admin.addCategory",
		});
	}

	// const noChanged = isEqual(categories, categoriesToEdit);
	const noChanged = true;

	async function save() {
		await appApi.admin.category.update(categoriesToEdit);
	}

	// todo: fix ltr
	return (
		<div className="w-full border p-20 ltr flex flex-grow  gap-5">
			{!!categoriesToEdit.length && (
				<CategoryTree setCategories={setCategoriesToEdit} categories={categoriesToEdit} />
			)}
			<div className="border w-80 p-4 flex flex-col sticky top-20 h-[80vh] self-start">
				<div className="">
					<Button fullWidth onPress={addCategory}>
						Add Category
					</Button>
				</div>
				<div className="mt-auto">
					<Button onPress={save} disabled={noChanged}>
						Save
					</Button>
				</div>
			</div>
		</div>
	);
}
