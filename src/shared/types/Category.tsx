export type Category = {
	id: string;
	name: string;
	parent: Category["id"] | ""; // empty string is root category
};
