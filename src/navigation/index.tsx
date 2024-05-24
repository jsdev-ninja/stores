import { createRouter } from "src/lib/router";

const Router = createRouter({
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
				children: {
					add: {
						path: "/add",
					},
				},
			},
		},
	},
});

export const { Link, Route, navigate } = Router;
