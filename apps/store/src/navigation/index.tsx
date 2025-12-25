import { createRouter } from "src/lib/router";
import type { LinkTo } from "src/lib/router";

export const routes = {
	store: {
		path: "/",
		children: {
			terms: {
				path: "/terms",
				exact: true,
			},
			catalog: {
				path: "/catalog/:category1/:category2/:category3/:category4/:category5",
				exact: false,
			},
			discounts: {
				path: "/discounts",
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
				path: "/orderSuccess",
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
			discounts: {
				path: "/discounts",
			},
			addProduct: {
				path: "/addProduct",
			},
			products: {
				path: "/products/:category1/:category2/:category3/:category4/:category5",
				exact: false,
			},
			editProduct: {
				path: "/editProduct/:id",
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
			createOrder: {
				path: "/createOrder",
			},
			order: {
				path: "/orders/:id",
			},
			users: {
				path: "/users",
			},
			clientProfile: {
				path: "/clients/:id",
			},
			organizations: {
				path: "/organizations",
			},
			organization: {
				path: "/organizations/:id",
			},
			organizationGroups: {
				path: "/organization-groups",
			},
			suppliers: {
				path: "/suppliers",
			},
			invoices: {
				path: "/invoices",
			},
			inventoryCertificate: {
				path: "/inventory-certificate",
			},
		},
	},
	superAdmin: {
		path: "/superAdmin",
	},
} as const;

export type TLinkTo = LinkTo<typeof routes>;

export const Router = createRouter(routes);

export const { Link, Route, navigate, useParams, Redirect, useLocation } = Router;
