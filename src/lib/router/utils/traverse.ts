import { Route, RouteKeys, Routes } from "../types";

export type RouteData = Route & { fullPath: string; name: RouteKeys<Routes> };

export function getRouteData(
	name: RouteKeys<Routes>,
	routes: Routes,
	result: RouteData | null = null
): RouteData | null {
	const segments = name.split(".");

	const [current, ...rest] = segments;

	const isLast = !rest.length;

	const route = routes[current];

	if (!route) return null;

	result = {
		...route,
		fullPath: !result ? route.path : result.fullPath.concat(route.path),
		name: result?.name ?? name,
	};

	if (isLast) return result;

	if (!route.children) return null;

	const newName = rest.join(".");

	return getRouteData(newName, route.children, result);
}
