import { useEffect, useState } from "react";
import { Button } from "src/components/button";
import { TCategory } from "@jsdev_ninja/core";
import { navigate } from "src/navigation";
import { CategoryTree } from "src/widgets/Category/CategoryTree/CategoryTree";
import { isEqual } from "lodash";
import { useAppApi } from "src/appApi";
import { useTranslation } from "react-i18next";

export function AdminCategoriesPages() {
	const appApi = useAppApi();
	const [categories, setCategories] = useState<TCategory[]>([]);
	const [categoriesToEdit, setCategoriesToEdit] = useState<TCategory[]>([]);

	const { t } = useTranslation(["common", "admin"]);

	useEffect(() => {
		setCategoriesToEdit(structuredClone(categories));
	}, [categories]);

	useEffect(() => {
		appApi.system.getStoreCategories().then((res) => {
			setCategories(res?.data?.categories ?? []);
		});
	}, []);

	function addCategory() {
		return navigate({
			to: "admin.addCategory",
		});
	}

	const noChanged = isEqual(categories, categoriesToEdit);

	async function save() {
		console.log("saved");

		await appApi.admin.category.update(categoriesToEdit, categories);
		setCategories(categoriesToEdit);
	}

	return (
		<div className="w-full border p-20 ltr flex flex-grow  gap-5">
			<CategoryTree setCategories={setCategoriesToEdit} categories={categoriesToEdit} />
			<div className="border w-80 p-4 flex flex-col sticky top-20 h-[80vh] self-start">
				<div className="">
					<Button fullWidth onPress={addCategory}>
						{t("admin:createCategory")}
					</Button>
				</div>
				<div className="mt-auto">
					<Button
						isLoading={appApi.loading["admin.category.update"]}
						onPress={save}
						color="danger"
						isDisabled={noChanged}
					>
						{t("save")}
					</Button>
				</div>
			</div>
		</div>
	);
}
