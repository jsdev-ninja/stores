import { ReactNode } from "react";
import { Route, RouteKeys, RouteParams, Routes } from "../types";
import { replaceParamsInPath } from "../utils";

export function createLink<T extends Routes>(routes: T, store: any) {
	type RoutePath<key extends string, T extends Routes> = key extends keyof T
		? T[key] extends Route
			? T[key]["path"]
			: never
		: key extends `${infer S}.${infer B}`
		? S extends keyof T
			? T[S] extends Route
				? B extends keyof T[S]["children"]
					? T[S] extends undefined
						? never
						: T[S]["children"] extends Routes
						? RoutePath<B, T[S]["children"]>
						: never
					: never
				: never
			: never
		: never;

	type TTo = RouteKeys<typeof routes>;

	function Link<K extends TTo>(
		props: RouteParams<RoutePath<K, typeof routes>> extends never
			? {
					to: K;
					children: ReactNode;
			  }
			: {
					to: K;
					children: ReactNode;
					params: RouteParams<RoutePath<K, typeof routes>>;
			  }
	) {
		const isDeepPath = props.to.includes(".");

		const fullPath = "";

		const p = "params" in props ? props.params : {};

		const path = replaceParamsInPath(fullPath, p); //todo fix type

		return (
			<a
				onClick={(e) => {
					e.preventDefault();
					console.log("navigate", path);

					store.navigate(path);
				}}
				href=""
			>
				{props.children}
			</a>
		);
	}

	function navigate<K extends TTo>(
		to: K,
		...[params]: RouteParams<RoutePath<K, typeof routes>> extends never
			? [] // todo fix parmas type
			: [RouteParams<RoutePath<K, typeof routes>>]
	) {
		const isDeepPath = to.includes(".");

		let fullPath = "";
		function getRoute() {
			if (!isDeepPath) {
				fullPath = fullPath.concat(routes[to].path);

				return routes[to];
			}

			const s = to.split(".");

			let x: Route | undefined = routes[s.shift()!];
			fullPath = fullPath.concat(x.path);

			s.forEach((a) => {
				x = x?.children?.[a];
				if (fullPath === "/") {
					fullPath = x?.path ?? "";
					return;
				}
				fullPath = fullPath.concat(x?.path ?? "");
			});

			const result = x;

			return result as Route;
		}

		const route = getRoute();

		console.log("route", route);

		const path = replaceParamsInPath(fullPath, params); //todo fix type

		console.log("navigate", path);

		store.navigate(path);
	}

	return { Link, navigate };
}
