import { Avatar } from "@nextui-org/react";
import { useTranslation } from "react-i18next";
import { useProfile } from "src/domains/profile";
import { modalApi } from "src/infra/modals";

function ProfilePage() {
	const { t } = useTranslation(["profilePage", "common"]);

	const profile = useProfile();

	if (!profile) {
		return null;
	}

	return (
		<div className="">
			<section className="bg-white py-8 antialiased dark:bg-gray-900 md:py-8">
				<div className="mx-auto max-w-screen-lg px-4 2xl:px-0">
					<h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl md:mb-6">
						{t("profilePage:title")}
					</h2>
					<div className="py-4 md:py-8">
						<div className="mb-4 grid gap-4 sm:grid-cols-2 sm:gap-8 lg:gap-16">
							<div className="space-y-4">
								<div className="flex gap-4">
									<div>
										<Avatar showFallback size="lg" />
									</div>
									<div>
										<h2 className="flex items-center text-xl font-bold leading-none text-gray-900 dark:text-white sm:text-2xl">
											{profile.displayName}
										</h2>
									</div>
								</div>
								<dl className="">
									<dt className="font-semibold text-gray-900 dark:text-white">
										{t("common:email")}
									</dt>
									<dd className="text-gray-500 dark:text-gray-400">{profile.email}</dd>
								</dl>
								<dl>
									<dt className="font-semibold text-gray-900 dark:text-white">
										{t("common:address")}
									</dt>
									<dd className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
										<svg
											className="hidden h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500 lg:inline"
											aria-hidden="true"
											xmlns="http://www.w3.org/2000/svg"
											width={24}
											height={24}
											fill="none"
											viewBox="0 0 24 24"
										>
											<path
												stroke="currentColor"
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="m4 12 8-8 8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5"
											/>
										</svg>
										{profile.address?.city}, {profile.address?.street}{" "}
										{profile.address?.streetNumber}
									</dd>
								</dl>
							</div>
							<div className="space-y-4">
								<dl>
									<dt className="font-semibold text-gray-900 dark:text-white">
										{t("common:phone")}
									</dt>
									<dd className="text-gray-500 dark:text-gray-400">
										{profile.phoneNumber}
									</dd>
								</dl>
							</div>
						</div>
						<button
							onClick={() => modalApi.openModal("profileEdit", { profile })}
							type="button"
							data-modal-target="accountInformationModal2"
							data-modal-toggle="accountInformationModal2"
							className="inline-flex w-full items-center justify-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 sm:w-auto"
						>
							<svg
								className="-ms-0.5 me-1.5 h-4 w-4"
								aria-hidden="true"
								xmlns="http://www.w3.org/2000/svg"
								width={24}
								height={24}
								fill="none"
								viewBox="0 0 24 24"
							>
								<path
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z"
								/>
							</svg>
							Edit your data
						</button>
					</div>
				</div>
			</section>
		</div>
	);
}

export default ProfilePage;
