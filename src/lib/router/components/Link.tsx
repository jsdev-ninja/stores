import { ReactNode } from "react";
import { Route, RouteKeys, RouteParams, Routes } from "../types";
import { replaceParamsInPath } from "../utils";
import { getRouteData } from "../utils/traverse";

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

	function _navigate(path: string) {
		store.navigate(path);

		document.startViewTransition?.(() => {
			console.log("_navigate", path);
		});
	}

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
		const routeConfig = getRouteData(props.to, routes);

		const p = "params" in props ? props.params : {};

		const path = replaceParamsInPath(routeConfig?.fullPath ?? "", p); //todo fix type

		return (
			<a
				onClick={(e) => {
					e.preventDefault();
					_navigate(path);
				}}
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
		const routeConfig = getRouteData(to, routes);

		const path = replaceParamsInPath(routeConfig?.fullPath ?? "", params); //todo fix type

		_navigate(path);
	}

	return { Link, navigate };
}
