import { Label, ListBox, Select } from "@heroui/react";
import { useStoreSwitcher } from "./useStoreSwitcher";

export function StoreSwitcher() {
	const { stores, currentStoreId, handleChange } = useStoreSwitcher();

	return (
		<Select
			className="w-72"
			placeholder="Select a store"
			value={currentStoreId}
			onChange={handleChange}
		>
			<Label>Store</Label>
			<Select.Trigger>
				<Select.Value />
				<Select.Indicator />
			</Select.Trigger>
			<Select.Popover>
				<ListBox>
					{stores.map((store) => (
						<ListBox.Item
							key={store.id}
							id={store.id}
							textValue={`${store.name} · ${store.companyId}/${store.id}`}
						>
							{store.name}
							<span className="ml-2 text-xs text-slate-400">
								{store.companyId}/{store.id}
							</span>
							<ListBox.ItemIndicator />
						</ListBox.Item>
					))}
				</ListBox>
			</Select.Popover>
		</Select>
	);
}
