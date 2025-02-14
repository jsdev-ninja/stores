import { useEffect, useState } from "react";
import { Button } from "src/components/button";
import { CategorySlice } from "src/domains/Category";
import { TCategory } from "@jsdev_ninja/core";
import { useAppSelector } from "src/infra";
import { navigate } from "src/navigation";
import { CategoryTree } from "src/widgets/Category/CategoryTree/CategoryTree";
import { isEqual } from "lodash";
import { useAppApi } from "src/appApi";

export function AdminCategoriesPages() {
	const appApi = useAppApi();
	const categories = useAppSelector(CategorySlice.selectors.selectCategories);
	const [categoriesToEdit, setCategoriesToEdit] = useState<TCategory[]>([]);

	useEffect(() => {
		setCategoriesToEdit(JSON.parse(JSON.stringify(categories)));
	}, [categories]);

	function addCategory() {
		return navigate({
			to: "admin.addCategory",
		});
	}

	const noChanged = isEqual(categories, categoriesToEdit);

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
					<Button fullWidth onClick={addCategory}>
						Add Category
					</Button>
				</div>
				<div className="mt-auto">
					<Button onClick={save} disabled={noChanged}>
						Save
					</Button>
				</div>
			</div>
		</div>
	);
}
