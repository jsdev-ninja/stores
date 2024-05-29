import { TCompany } from "../Company";

export type TStore = {
	id: string;
	companyId: TCompany["id"];
	websiteDomain: string;
	logoUrl: string;
};
