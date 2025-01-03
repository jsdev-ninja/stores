import { useSearchBox } from "react-instantsearch";
import { useDebounce } from "src/utils";

export function SearchBox() {
	const search = useSearchBox({});

	const onSearch = useDebounce(search.refine);
	return (
		<div className="w-full">
			<input
				onChange={(event) => {
					const value = event.target.value;
					onSearch(value);
				}}
				type="search"
				className="shadow w-full h-10 rounded-lg bg-gray-100 px-4 text-gray-700"
				placeholder="search product"
			/>
		</div>
	);
}
