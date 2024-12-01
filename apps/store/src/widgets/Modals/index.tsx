import { AuthModal } from "src/features/auth";
import { CategoryFormModal } from "src/features/category/CategoryFormModal";
import { modalsSlice } from "src/infra/modals";

import { AnimatePresence } from "framer-motion";
import { ReactNode, cloneElement } from "react";
import { useAppSelector } from "src/infra";
import { AdminCompanyCreateModal } from "./modals/AdminCompanyCreateModal";
import { ProfileEditModal } from "./ProfileEditModal";
import { TProfile } from "src/types";

export const ModalsContainer = ({ children }: { children: ReactNode }) => {
	return <AnimatePresence>{children}</AnimatePresence>;
};

export const modals = {
	profileEdit: ({ profile }: { profile: TProfile }) => <ProfileEditModal profile={profile} />,
	authModal: () => <AuthModal />,
	AdminCompanyCreateModal: () => <AdminCompanyCreateModal />,
	categoryFormModal: ({ categoryId }: { categoryId: string }) => (
		<CategoryFormModal categoryId={categoryId} />
	),
};

export function ModalProvider() {
	const openModals = useAppSelector(modalsSlice.selectors.selectModals);

	return (
		<ModalsContainer>
			{openModals.map((modal) => {
				const component = modals[modal.id as keyof typeof modals](modal.props as any); //todo fix any

				return cloneElement(component, { key: modal.id });
			})}
		</ModalsContainer>
	);
}

declare global {
	type ModalType = typeof modals;
}
