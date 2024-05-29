import { createRouter } from "src/lib/router";

const routes = {
	store: {
		path: "/",
		children: {
			home: {
				path: "/",
			},
			catalog: {
				path: "/catalog",
				exact: false,
			},
			cart: {
				path: "/cart",
			},
			checkout: {
				path: "/checkout",
			},
		},
	},
	admin: {
		path: "/admin",
		children: {
			addProduct: {
				path: "/addProduct",
			},
			products: {
				path: "/products",
			},
			categories: {
				path: "/categories",
			},
			addCategory: {
				path: "/addCategory",
			},
		},
	},
} as const;

const Router = createRouter(routes);

export const { Link, Route, navigate } = Router;
