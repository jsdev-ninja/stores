import { useState } from "react";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { FileDropzone } from "src/components/FileDropzone";
import { useStore } from "src/domains/Store";

function AdminSettingsPage() {
	const [logo, setLogo] = useState<File | null>(null);

	const store = useStore();

	const appApi = useAppApi();

	async function uploadLogo() {
		if (!store || !logo) return;
		await appApi.admin.uploadLogo({ logo });
	}

	return (
		<div className="">
			<div className="">
				<label htmlFor="">Upload Logo</label>
				<FileDropzone
					onChange={(files) => {
						const image = files[0];
						setLogo(image ?? null);
					}}
				/>
			</div>
			<div className="flex gap-4">
				<Button isDisabled={!logo} onClick={uploadLogo}>
					Save
				</Button>
				<Button>Back</Button>
			</div>
		</div>
	);
}
export default AdminSettingsPage;
