import { TCompany } from "../Company";
import { TStore } from "../Store";

export type TCategory = {
	id: string;
	companyId: TCompany["id"];
	storeId: TStore["id"];
	name: string;
	displayName: string;
	parentId?: TCategory["id"] | ""; // empty string is root category
};
