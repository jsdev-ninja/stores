import { ReactNode, useEffect } from "react";
import { createStore } from "./store";
import { Route, RouteKeys, RouteParams, Routes } from "./types";
import { comparePathWithRoutePath } from "./utils";
import { createLink } from "./components/Link";
import { RouteData, getRouteData } from "./utils/traverse";

// rank routing
// active link (NavLink)
// animation
// 404
// Scroll Restoration
// hooks
//  useParams
//  useNavigate
//  useLocation
//  useHistory
// query paramsp

export type { RouteKeys };

function checkChildMatch(
	route: Route | undefined,
	pathname: string = "",
	parent?: Route | undefined
): boolean {
	if (!route) return false;

	const fullPath = (parent?.path ? (parent.path === "/" ? "" : parent.path) : "") + route.path;

	if (comparePathWithRoutePath(pathname, fullPath, route.exact)) {
		return true;
	}
	if (!route?.children) return false;

	return Object.values(route?.children).some((r) => checkChildMatch(r, pathname, route));
}

export type LinkTo<T extends Routes> = RouteKeys<T>;

export function createRouter<T extends Routes>(routes: T) {
	const store = createStore(routes);

	const { Link, navigate } = createLink<T>(routes, store);

	function useLocation() {
		const state = store.useRouterStore();

		const location = {
			pathname: state.pathname,
		};
		function setLocation({ path }: { path: string }) {
			store.navigate({
				path,
			});
		}
		return [location, setLocation] as const;
	}

	function matchRoute(routeData: RouteData, pathname: string): { match: boolean; exact: boolean } {
		const exactMatch = comparePathWithRoutePath(pathname, routeData.fullPath, routeData.exact);

		const isContain = pathname.includes(routeData.fullPath);

		const isChildMatch = isContain && checkChildMatch(routeData, pathname);

		return {
			match: exactMatch || !!isChildMatch,
			exact: exactMatch,
		};
	}

	function Route(props: { name: RouteKeys<T>; children: ReactNode; index?: boolean }) {
		const state = store.useRouterStore();

		const routeData = getRouteData(props.name, routes);

		if (!routeData) return null;

		const isRouteMatch = matchRoute(routeData, state.pathname);

		if (!isRouteMatch.match) {
			return null;
		}

		if (props.index && !isRouteMatch.exact) {
			return null;
		}

		return props.children;
	}

	function Redirect(props: { name: RouteKeys<T> }) {
		store.useRouterStore();

		const routeData = getRouteData(props.name, routes);

		useEffect(() => {
			navigate({
				to: props.name,
			});
		}, []);

		if (!routeData) return null;

		return null;
	}

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

	function useParams<K extends TTo>(
		name: K
	): RouteParams<RoutePath<K, typeof routes>> extends never
		? Record<string, never>
		: RouteParams<RoutePath<K, typeof routes>> {
		const { pathname } = store.useRouterStore();

		type Result = RouteParams<RoutePath<K, typeof routes>> extends never
			? Record<string, never>
			: RouteParams<RoutePath<K, typeof routes>>;

		const route = getRouteData(name, routes);

		if (!route) {
			return {} as Result;
		}
		const isMatch = matchRoute(route, pathname);
		if (!isMatch.match) {
			return {} as Result;
		}

		const result: { [key: string]: string } = {};

		const segments = route?.fullPath.split("/").filter(Boolean);
		const pathSegments = pathname.split("/").filter(Boolean);

		segments?.forEach((segment, index) => {
			if (segment.startsWith(":")) {
				const paramName = segment.slice(1);
				result[paramName] = pathSegments[index] ?? "";
			}
		});

		return result as Result;
	}

	return {
		navigate: navigate,
		Link: Link,
		Redirect: Redirect,
		Route: Route,
		useParams: useParams,
		useLocation: useLocation,
	};
}
