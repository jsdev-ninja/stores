import { Button, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import { isFile, TFile } from "@jsdev_ninja/core";
import { useRef } from "react";

export type FileUploadProps = {
	value?: File | TFile;
	onChange?: ({ value }: { value?: File }) => void;
};
export function FileUpload(props: FileUploadProps) {
	const { value, onChange } = props;

	const fileInputRef = useRef<HTMLInputElement>(null);

	const previewSrc = isFile(value) ? value.url : value ? URL.createObjectURL(value) : "";

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		onChange?.({ value: file });
	};

	const handleRemoveImage = () => {
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
			onChange?.({ value: undefined });
		}
	};

	return (
		<div className="flex items-center justify-center w-full">
			<label
				htmlFor="dropzone-file"
				className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-content1 border-default-300 hover:bg-content2"
			>
				{previewSrc ? (
					<div className="relative w-full h-full">
						<div className="overflow-hidden  h-full flex justify-center items-center">
							<Image
								src={previewSrc}
								alt="Product"
								className="object-contain w-full h-full"
							/>
						</div>
						<Button
							isIconOnly
							color="danger"
							variant="shadow"
							size="sm"
							className="absolute top-2 right-2 z-10"
							onPress={handleRemoveImage}
						>
							<Icon icon="lucide:x" />
						</Button>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center pt-5 pb-6">
						<Icon icon="lucide:upload-cloud" className="w-8 h-8 mb-4 text-default-500" />
						<p className="mb-2 text-sm text-default-500">
							<span className="font-semibold">Click to upload</span> or drag and drop
						</p>
						<p className="text-xs text-default-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
					</div>
				)}
				<input
					id="dropzone-file"
					type="file"
					className="hidden"
					accept="image/*"
					onChange={handleImageUpload}
					ref={fileInputRef}
				/>
			</label>
		</div>
	);
}
