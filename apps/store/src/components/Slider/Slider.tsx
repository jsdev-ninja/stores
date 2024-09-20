import { Range, Root, Track, Thumb } from "@radix-ui/react-slider";
import { useState } from "react";

export const Slider = ({
	onChange,
}: {
	onChange?: ({ value }: { value: Array<number> }) => void;
}) => {
	const [_value, _setValue] = useState([0, 100]);

	return (
		<Root
			className="relative flex items-center select-none touch-none w-full h-5"
			defaultValue={[0, 100]}
			value={_value}
			onValueChange={_setValue}
			max={100}
			step={1}
			onValueCommit={(newValue) =>
				onChange?.({
					value: newValue,
				})
			}
		>
			<Track className="bg-blackA7 relative grow rounded-full h-[3px]">
				<Range className="absolute bg-red-300 rounded-full h-full" />
			</Track>
			<Thumb className=" h-10 w-10 text-sm flex items-center justify-center p-2  bg-white shadow-[0_2px_10px] shadow-blackA4 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA5">
				{_value[0]}
			</Thumb>
			<Thumb className=" h-10 w-10  flex items-center justify-center p-2   bg-white shadow-[0_2px_10px] shadow-blackA4 rounded-[10px] hover:bg-violet3 focus:outline-none focus:shadow-[0_0_0_5px] focus:shadow-blackA5">
				{_value[1]}
			</Thumb>
		</Root>
	);
};
