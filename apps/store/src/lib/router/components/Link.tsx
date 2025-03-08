import { ReactNode } from "react";
import { Route, RouteKeys, RouteParams, Routes } from "../types";
import { replaceParamsInPath } from "../utils";
import { getRouteData } from "../utils/traverse";
import { Link as UiLink, LinkProps } from "@heroui/react";

type TUiLinkProps = Omit<LinkProps, "href">;

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

	async function _navigate({ path, state }: { path: string; state?: any }) {
		store.navigate({ path, state });
	}

	type Props<K extends string> = RouteParams<RoutePath<K, typeof routes>> extends never
		? {
				to: K;
				children: ReactNode;
				className?: string;
				state?: any;
		  }
		: {
				to: K;
				children: ReactNode;
				params: RouteParams<RoutePath<K, typeof routes>>;
				className?: string;
				state?: any;
		  };

	function Link<K extends TTo>(props: Props<K> & TUiLinkProps) {
		const routeConfig = getRouteData(props.to ?? "", routes);

		const p = "params" in props ? props.params : {};

		const path = replaceParamsInPath(routeConfig?.fullPath ?? "", p); //todo fix type

		return (
			<UiLink
				onPress={() => {
					_navigate({ path, state: props.state });
				}}
			>
				{props.children}
			</UiLink>
		);
	}

	async function navigate<K extends TTo>(props: {
		to: K;
		state?: any;
		params?: RouteParams<RoutePath<K, typeof routes>> extends never
			? undefined
			: RouteParams<RoutePath<K, typeof routes>>;
	}) {
		const { params, state, to } = props;
		const routeConfig = getRouteData(to, routes);

		const path = replaceParamsInPath(routeConfig?.fullPath ?? "", params);

		return await _navigate({ path, state });
	}

	return { Link, navigate };
}
