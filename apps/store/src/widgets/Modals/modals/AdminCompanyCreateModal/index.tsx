import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Button } from "src/components/button";
import { Card } from "src/components/Card";
import { Form } from "src/components/Form";
import { Input } from "src/components/Form/Input";
import { Modal } from "src/components/Modal/Modal";
import { useStore } from "src/domains/Store";
import { modalApi } from "src/infra/modals";
// import { SentryApi } from "src/lib/sentry";
import { ProfileSchema } from "@jsdev_ninja/core";
import { z } from "zod";
import { passwordSchema } from "src/types";
import { FirebaseApi } from "src/lib/firebase";

const NewCompanySchema = ProfileSchema.extend({
	password: passwordSchema,
}).omit({ id: true });

type TNewCompany = z.infer<typeof NewCompanySchema>;

export function AdminCompanyCreateModal() {
	const store = useStore();

	const appApi = useAppApi();

	const { t } = useTranslation(["common"]);

	if (!store) {
		return null;
	}

	return (
		<Modal>
			<div className="max-w-screen-sm w-full">
				<Card>
					<Form<TNewCompany>
						schema={NewCompanySchema}
						defaultValues={{
							type: "Profile",
							companyId: store.companyId,
							storeId: store.id,
							tenantId: store.tenantId,
							clientType: "company",
							displayName: "",
							email: "",
							password: "",
							address: {
								country: "",
								city: "",
								street: "",
								streetNumber: "",
								floor: "",
								apartmentEnterNumber: "",
								apartmentNumber: "",
							},
						}}
						className="p-4"
						onSubmit={async (formData: any) => {
							await appApi.admin.companyCreate({
								...formData,
								id: FirebaseApi.firestore.generateDocId("companies"),
							});
							modalApi.closeModal("AdminCompanyCreateModal");
						}}
						onError={() => {}}
					>
						<div className="flex flex-col gap-4">
							<div className="">
								<Input<TNewCompany>
									name="displayName"
									label={t("common:fullName")}
									placeholder={t("common:fullName")}
								/>
							</div>
							<div className="">
								<Input<TNewCompany>
									name="email"
									label={t("common:email")}
									placeholder={t("common:email")}
								/>
							</div>
							<div className="">
								<Input<TNewCompany>
									name="password"
									label={t("common:password")}
									placeholder={t("common:password")}
								/>
							</div>
							<div className="">
								<Form.Input<TNewCompany>
									placeholder={t("common:phone")}
									name="phoneNumber"
									label={t("common:phone")}
								/>
							</div>
							<div className="flex gap-4 mx-auto text-center">
								<Button type="submit">Create Company</Button>
								<Button
									onClick={() => modalApi.closeModal("AdminCompanyCreateModal")}
									type="button"
								>
									Cancel
								</Button>
							</div>
						</div>
					</Form>
				</Card>
			</div>
		</Modal>
	);
}
