export type Cart = {
	id: string;
	products: {
		[key: string]: {
			amount: number;
			product: any;
		};
	};
};
