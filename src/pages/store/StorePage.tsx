import { useAppSelector } from "src/infra";

import { navigate } from "src/navigation";
import { CategorySlice } from "src/domains/Category";

const colors = [
	"#d68533",
	"#f8b53e",
	"#6c6d53",
	"#f3c976",
	"#aba79f",
	"#e79d38",
	"#b29148",
	"#af9b64",
	"#cfb88a",
	"#e79d38",
	"#b29148",
	"#af9b64",
	"#cfb88a",
	"#e79d38",
	"#b29148",
	"#af9b64",
	"#cfb88a",
	"#e79d38",
	"#b29148",
	"#af9b64",
	"#cfb88a",
	"#e79d38",
	"#b29148",
	"#af9b64",
	"#cfb88a",
	"#e79d38",
	"#b29148",
	"#af9b64",
	"#cfb88a",
	"#e79d38",
];

function getColorFromString(str: string) {
	const index = hashStringToIndex(str);
	return colors[index];
}

function hashStringToIndex(str: string) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	return Math.abs(hash) % colors.length;
}

export function StorePage() {
	const categories = useAppSelector(CategorySlice.selectors.selectCategories);
	const rootCategories = useAppSelector(CategorySlice.selectors.selectCategories).filter(
		(c) => !c.parentId
	);

	return (
		<div className="">
			<div
				className="w-full h-80 bg-cover"
				style={{
					backgroundImage: "url(/banner.png)",
				}}
			></div>
			<div className="p-4">
				<div className="flex flex-col gap-8">
					{rootCategories.map((category) => {
						const subCategories = categories.filter(
							(categoryItem) => categoryItem.parentId === category.id
						);

						return (
							<div key={category.id} className="flex flex-col gap-5">
								<div className="text-2xl font-semibold">{category.locales[0].value}</div>
								<div className="flex gap-4 items-center flex-wrap">
									{subCategories.map((subCategory) => (
										<div
											key={subCategory.id}
											className="shadow py-5 px-10 rounded-2xl text-white text-lg cursor-pointer"
											style={{
												background: getColorFromString(category.tag),
											}}
											onClick={() => {
												navigate({
													to: "store.category",
													params: {
														rootCategory: category.tag,
														subCategory: subCategory.tag,
													},
												});
											}}
										>
											{subCategory.locales[0].value}
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
