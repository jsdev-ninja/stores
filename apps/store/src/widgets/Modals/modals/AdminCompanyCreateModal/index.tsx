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
import { ProfileSchema, passwordSchema } from "src/types";
import { z } from "zod";

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
							fullName: "",
							email: "",
							password: "",
							phoneNumber: { code: "+972", number: "" },
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
						onSubmit={async (formData) => {
							console.log("formData", formData);
							await appApi.admin.companyCreate(formData);
							// tood update profiles
							modalApi.closeModal("AdminCompanyCreateModal");
						}}
						onError={(errors) => {
							console.log("errors", errors);
						}}
					>
						<div className="flex flex-col gap-4">
							<div className="">
								<Input<TNewCompany>
									name="fullName"
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
									name="phoneNumber.number"
									label={t("common:phone")}
									endAdornment={<span dir="ltr">+972</span>}
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