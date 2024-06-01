import { ReactNode } from "react";
import { createStore } from "./store";
import { Route, RouteKeys, Routes } from "./types";
import { comparePathWithRoutePath } from "./utils";
import { createLink } from "./components/Link";

// nested routes
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
// query params

export type { RouteKeys };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getRoutePath(name: any, routes: any, base: string = "") {
	if (!routes) return base;

	const segments = name.split(".");

	const [current, ...rest] = segments;

	const isLast = !rest.length;

	const route = routes[current];

	const path = base.concat(route.path);

	if (isLast) return path;

	return getRoutePath(rest.join("."), route.children, path);
}

function checkChildMatch(route: Route | undefined, pathname: string = ""): boolean {
	if (!route) return false;
	if (comparePathWithRoutePath(pathname, route.path)) {
		return true;
	}
	if (!route?.children) return false;

	return Object.values(route?.children).some((r) => checkChildMatch(r, pathname));
}

export function createRouter<T extends Routes>(routes: T) {
	const store = createStore(routes);

	const { Link, navigate } = createLink<T>(routes, store);

	// match is exact
	// if not exact check if any children match

	function matchRoute(name: RouteKeys<T>, pathname: string): { match: boolean; exact: boolean } {
		const routeConfig = getRouteConfigByName(name);

		const routePath = getRoutePath(name, routes, "");

		const exactMatch = comparePathWithRoutePath(pathname, routePath);

		const isChildMatch = checkChildMatch(routeConfig, pathname);

		return {
			match: exactMatch || !!isChildMatch,
			exact: exactMatch,
		};
	}

	function getRouteConfigByName(routeName: RouteKeys<T>): Route | undefined {
		const segments = routeName.split(".");

		const rootRoute = segments.shift();

		let route: Route | undefined = rootRoute ? routes[rootRoute] : undefined;

		if (segments.length) {
			segments.forEach((segment) => {
				if (!route?.children?.[segment] && !route?.children?.[segment]?.path) {
					return null;
				}

				route = route.children[segment];
			});
		}

		return route;
	}

	function Route(props: { name: RouteKeys<T>; children: ReactNode }) {
		const state = store.useRouterStore();
		// const routeConfig = getRouteConfigByName(props.name);

		const isRouteMatch = matchRoute(props.name, state.pathname);

		if (isRouteMatch.match) {
			console.warn("name", props.name, isRouteMatch);
		}

		if (!isRouteMatch.match) {
			return null;
		}

		return props.children;
	}

	return {
		navigate: navigate,
		Link: Link,
		Route: Route,
	};
}
