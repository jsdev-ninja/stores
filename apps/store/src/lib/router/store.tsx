import { useSyncExternalStore } from "react";
import { Routes } from "./types";

let listeners: (() => void)[] = [];

function resolveActiveRoutes(routes: Routes, path: string, prefix = "") {
	let activeRoutes: any = {};

	const segments = path.split("/").slice(1);

	let _routes = structuredClone(routes);

	const entries = Object.entries(_routes);

	entries.forEach(([name, route]) => {
		let isActive = false;
		const routesSegments = route.path.split("/").slice(1);

		const fullName = prefix ? `${prefix}.${name}` : name;

		if (routesSegments.length !== segments.length && !route.children) {
			isActive = false;
		} else if (routesSegments.length !== segments.length && route.children) {
			const activeRoutesChildren = resolveActiveRoutes(
				route.children,
				path.replace(route.path, ""),
				name
			);
			activeRoutes = { ...activeRoutes, ...activeRoutesChildren, [fullName]: route };
		} else {
			isActive = routesSegments.every(
				(routesSegment, index) =>
					routesSegment.startsWith(":") || routesSegment === segments[index]
			);
		}
		if (isActive) {
			activeRoutes[fullName] = route;
		}
	});

	return activeRoutes;
}

export function createStore(routes: Routes) {
	let routerState = {
		currentRoute: getRouteFromPath(routes, window.location.pathname),
		pathname: window.location.pathname,
		activeRoutes: resolveActiveRoutes(routes, window.location.pathname),
	};

	const subscribe = (listener: () => void) => {
		listeners = [...listeners, listener];
		return () => {
			listeners = listeners.filter((l) => l !== listener);
		};
	};

	const navigate = ({ path, state }: { path: string; state?: any }) => {
		history.pushState(state ?? {}, "", path);

		routerState = {
			pathname: path,
			currentRoute: getRouteFromPath(routes, path),
			activeRoutes: resolveActiveRoutes(routes, window.location.pathname),
		};

		update();
	};
	const getSnapshot = () => routerState;

	window.addEventListener("popstate", function () {
		const path = window.location.pathname;
		routerState = {
			pathname: path,
			currentRoute: getRouteFromPath(routes, path),
			activeRoutes: resolveActiveRoutes(routes, window.location.pathname),
		};
		update();
	});

	return {
		state: routerState,
		subscribe,
		getSnapshot,
		navigate,
		useRouterStore: () => useSyncExternalStore(subscribe, getSnapshot),
	};
}

function update() {
	if (!document.startViewTransition) return emitChange();
	const transition = document.startViewTransition?.(() => {
		emitChange();
	});
	transition.finished.then(() => {});
}

function getRouteFromPath(routes: Routes, path: string) {
	const route = Object.values(routes).find((route) => {
		if (route.path === path) return true;
		return false;
	});
	return route;
}

function emitChange() {
	for (const listener of listeners) {
		listener();
	}
}
