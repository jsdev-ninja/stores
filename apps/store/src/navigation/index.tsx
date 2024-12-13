import { createRouter } from "src/lib/router";

export const routes = {
	store: {
		path: "/",
		children: {
			catalog: {
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
			orders: {
				path: "/orders",
			},
			orderPage: {
				path: "/orders/:id",
			},
			orderSuccess: {
				path: "/orderSuccess/:orderId",
			},
			profile: {
				path: "/profile",
			},
			favoritesProducts: {
				path: "/favorites-products",
			},
		},
	},
	admin: {
		path: "/admin",
		children: {
			settings: {
				path: "/settings",
			},
			addProduct: {
				path: "/addProduct",
			},
			products: {
				path: "/products",
			},
			editProduct: {
				path: "/products/:id",
			},
			productsByCategory: {
				path: "/products/category/:categoryName",
			},
			categories: {
				path: "/categories",
			},
			addCategory: {
				path: "/addCategory",
			},
			orders: {
				path: "/orders",
			},
			order: {
				path: "/orders/:id",
			},
			users: {
				path: "/users",
			},
		},
	},
	superAdmin: {
		path: "/superAdmin",
	},
} as const;

export const Router = createRouter(routes);

export const { Link, Route, navigate, useParams, Redirect, useLocation } = Router;
