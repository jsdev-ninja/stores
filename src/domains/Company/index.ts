export type TCompany = {
	id: string;
	name: string;
	websiteDomains: Array<string>;
	owner: {
		fullName: string;
		email: string;
		phone: number;
	};
};
