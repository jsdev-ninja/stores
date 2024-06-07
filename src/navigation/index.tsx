import { createRouter } from "src/lib/router";

export const routes = {
	store: {
		path: "/",
		children: {
			home: {
				path: "/",
			},
			category: {
				path: "/category/:rootCategory/:subCategory",
				exact: false,
			},

			product: {
				path: "/products/:id",
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

export const Router = createRouter(routes);

export const { Link, Route, navigate, useParams } = Router;
