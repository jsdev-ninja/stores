import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { type DragEvent, useRef, useState, useEffect } from "react";
import { Icon } from "..";

interface FileWithPreview extends File {
	preview: string;
}

type Props = {
	multiple?: boolean; //todo: handle multiple
	onChange?: (files: FileWithPreview[]) => void;
};
export function FileDropzone(props: Props) {
	const { multiple, onChange } = props;

	const [files, setFiles] = useState<FileWithPreview[]>([]);

	const [isDragActive, setIsDragActive] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(true);
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);
	};

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);

		const droppedFiles = Array.from(e.dataTransfer.files);
		handleFiles(droppedFiles);
	};

	const handleFiles = (fileList: File[]) => {
		const newFiles = fileList.map((file) =>
			Object.assign(file, {
				preview: URL.createObjectURL(file),
			})
		);
		setFiles((prevFiles) => [...prevFiles, ...newFiles]);
	};

	const handleButtonClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			handleFiles(Array.from(e.target.files));
		}
	};

	const handleDeleteFile = (fileToDelete: FileWithPreview) => {
		setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToDelete));
		URL.revokeObjectURL(fileToDelete.preview);
	};

	useEffect(() => {
		onChange?.(files);
	}, [files]);

	return (
		<div className="p-8 w-96">
			<motion.div
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				onClick={handleButtonClick}
				className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors size-full ${
					isDragActive
						? "border-blue-500 bg-blue-500/5"
						: "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500"
				}`}
				whileHover={{ scale: 1.01 }}
				whileTap={{ scale: 0.98 }}
			>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					onChange={handleFileInputChange}
					className="hidden"
					accept="image/*,application/pdf"
				/>
				<AnimatePresence>
					{isDragActive ? (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
							className=" pointer-events-none select-none"
						>
							<div className="mx-auto size-8 text-blue-500 pointer-events-none select-none">
								<Icon name="upload" />
							</div>
							<p className="mt-2 text-sm text-blue-500 pointer-events-none select-none">
								Drop files here...
							</p>
						</motion.div>
					) : (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							transition={{ duration: 0.2 }}
						>
							<div className="mx-auto size-8 text-neutral-400 dark:text-neutral-500">
								<Icon name="upload" />
							</div>
							<p className="mt-2 text-sm text-neutral-400 dark:text-neutral-500 tracking-tighter text-balance font-medium">
								Drag and drop files here, or click to select
							</p>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>

			<AnimatePresence>
				{files.length > 0 && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="mt-4 space-y-2"
					>
						{files.map((file, index) => {
							if (!multiple && index > 0) return null;
							return (
								<motion.div
									key={file.name}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 20 }}
									className="flex items-center p-1 rounded-lg bg-neutral-400/10"
								>
									{file.type.startsWith("image/") ? (
										<img
											src={file.preview}
											alt={file.name}
											className="size-10 object-contain rounded mr-2"
										/>
									) : (
										<div className="size-10 text-neutral-500 mr-2">
											<Icon name="document" />
										</div>
									)}
									<span className="flex-1 truncate text-xs tracking-tighter text-neutral-600 dark:text-neutral-400">
										{file.name}
									</span>
									<div className="size-5 text-red-500 cursor-pointer hover:text-red-600 transition-colors mr-2">
										<Icon
											name="trash"
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteFile(file);
											}}
										/>
									</div>
								</motion.div>
							);
						})}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
