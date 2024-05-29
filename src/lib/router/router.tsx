import { ReactNode } from "react";
import { createStore } from "./store";
import { Route, RouteKeys, RouteParams, Routes } from "./types";
import { comparePathWithRoutePath, replaceParamsInPath } from "./utils";
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

export function createRouter<T extends Routes>(routes: T) {
	const store = createStore(routes);

	const { Link, navigate } = createLink<T>(routes, store);

	// match is exact
	// if not exact check if any children match

	function matchRoute(name: RouteKeys<T>, pathname: string): { match: boolean; exact: boolean } {
		const routeConfig = getRouteConfigByName(name);

		const exactMatch = comparePathWithRoutePath(pathname, routeConfig.fullPath);

		const childrenPath = pathname.replace(routeConfig.fullPath, "");
		const pathSegments = childrenPath.split("/").filter(Boolean);

		const isContain = pathname.includes(routeConfig.fullPath);
		console.log("routeConfig.fullPath", routeConfig.fullPath, pathname);

		const isChildMatch = !exactMatch && isContain ? check(routeConfig, pathSegments) : false;
		function check(r, paths) {
			if (!r) return false;

			const [current, ...rest] = paths;

			if (!r?.children?.[current]) return false;

			if (r?.children?.[current] && rest.length === 0) {
				return true;
			}

			return check(r?.children?.[current], rest);
		}

		return {
			match: exactMatch || !!isChildMatch,
			exact: exactMatch,
		};
	}

	function getRouteConfigByName(routeName: RouteKeys<T>) {
		const segments = routeName.split(".");

		const rootRoute = segments.shift();

		let route: Route | undefined = rootRoute ? routes[rootRoute] : undefined;
		let deepPath = route?.path ?? "";

		if (segments.length) {
			segments.forEach((segment) => {
				if (!route?.children?.[segment] && !route?.children?.[segment]?.path) {
					return null;
				}

				route = route.children[segment];

				if (deepPath === "/") {
					deepPath = route.path;
					return;
				}

				deepPath = deepPath.concat(route.path);
			});
		}

		return { ...route, fullPath: deepPath };
	}

	function Route(props: { name: RouteKeys<T>; children: ReactNode }) {
		const state = store.useRouterStore();
		const routeConfig = getRouteConfigByName(props.name);

		const isRouteMatch = matchRoute(props.name, state.pathname);

		console.log("name", props.name, isRouteMatch);

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
