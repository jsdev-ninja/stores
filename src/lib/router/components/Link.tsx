import { ReactNode } from "react";
import { Route, RouteKeys, RouteParams, Routes } from "../types";
import { replaceParamsInPath } from "../utils";

export function createLink<T extends Routes>(routes: T, store: any) {
	function Link<K extends RouteKeys<typeof routes>>(
		props: RouteParams<(typeof routes)[K]["path"]> extends never
			? {
					to: K;
					children: ReactNode;
			  }
			: {
					to: K;
					children: ReactNode;
					params: RouteParams<T[K]["path"]>;
			  }
	) {
		const isDeepPath = props.to.includes(".");

		let fullPath = "";
		function getRoute() {
			if (!isDeepPath) {
				return routes[props.to];
			}

			const s = props.to.split(".");

			let x: Route | undefined = routes[s.shift()!];
			fullPath = fullPath.concat(x.path);

			s.forEach((a) => {
				x = x?.children?.[a];
				fullPath = fullPath.concat(x?.path ?? "");
			});

			const result = x;

			return result as Route;
		}

		const route = getRoute();

		const path = replaceParamsInPath(fullPath, props.params); //todo fix type

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

	function navigate<K extends RouteKeys<typeof routes>>(
		to: K,
		params?: RouteParams<(typeof routes)[K]["path"]> extends never
			? undefined // todo fix parmas type
			: RouteParams<T[K]["path"]>
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
				fullPath = fullPath.concat(x?.path ?? "");
			});

			const result = x;

			return result as Route;
		}

		const route = getRoute();

		const path = replaceParamsInPath(fullPath, params); //todo fix type

		store.navigate(path);
	}

	return { Link, navigate };
}
