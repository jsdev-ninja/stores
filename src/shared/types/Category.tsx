export type Category = {
	id: string;
	name: string;
	displayName: string;
	parent?: Category["id"] | ""; // empty string is root category
};
