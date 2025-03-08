import { ProfileSchema, TProfile } from "@jsdev_ninja/core";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useAppApi } from "src/appApi";
import { Form } from "src/components/Form";
import { Button } from "src/components/button";
import { modalApi } from "src/infra/modals";

const schema = ProfileSchema.optional();

export function ProfileEditModal({ profile }: { profile: TProfile }) {
	const { t } = useTranslation(["common"]);

	const appApi = useAppApi();
	return (
		<Modal
			scrollBehavior="inside"
			placement="top-center"
			isOpen
			onClose={() => modalApi.closeModal("profileEdit")}
		>
			<Form<TProfile>
				onSubmit={async (data) => {
					await appApi.user.profileUpdate({ profile: data });
					modalApi.closeModal("profileEdit");
				}}
				onError={(errors) => {
					console.log("error", errors);
				}}
				defaultValues={{ ...profile }}
				schema={schema}
				className=""
			>
				<ModalContent className="">
					<ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader>
					<ModalBody className="p-4 md:p-5  grid grid-cols-1 gap-4">
						<Form.Input<TProfile>
							name="displayName"
							label={t("fullName")}
							type="text"
							placeholder="Enter your first name"
						/>

						<Form.Input<TProfile>
							label={t("common:email")}
							name="email"
							type="text"
							placeholder="Enter your email here"
						/>

						<Form.Input<TProfile>
							name="phoneNumber"
							label={t("common:phone")}
							type="text"
							placeholder="123-456-7890"
						/>

						<Form.Input<TProfile> label={t("common:city")} name="address.city" />
						<Form.Input<TProfile> label={t("common:street")} name="address.street" />
						<Form.Input<TProfile>
							label={t("common:streetNumber")}
							name="address.streetNumber"
						/>
						<Form.Input<TProfile> label={t("common:floor")} name="address.floor" />
						<Form.Input<TProfile>
							label={t("common:apartmentEnterNumber")}
							name="address.apartmentEnterNumber"
						/>
						<Form.Input<TProfile>
							label={t("common:apartmentNumber")}
							name="address.apartmentNumber"
						/>
					</ModalBody>
					<ModalFooter>
						<Button
							onPress={() => modalApi.closeModal("profileEdit")}
							color="danger"
							variant="light"
						>
							{t("common:close")}
						</Button>
						<Button type="submit" color="primary">
							{t("common:save")}
						</Button>
					</ModalFooter>
				</ModalContent>
			</Form>
		</Modal>
	);
}
