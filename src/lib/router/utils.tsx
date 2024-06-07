export function replaceParamsInPath(path: string, params?: object) {
	if (!params) return path;

	let newPath = path;

	Object.entries(params).forEach(([paramName, paramValue]) => {
		newPath = newPath.replace(`:${paramName}`, paramValue);
	});

	return newPath;
}

export function comparePathWithRoutePath(path: string, routePath: string, exact?: boolean) {
	const isExact = exact ?? true;
	const pathSegments = path.split("/").filter(Boolean);
	const routePathSegments = routePath.split("/").filter(Boolean);

	if (pathSegments.length !== routePathSegments.length && isExact) {
		return false;
	}

	return routePathSegments.every((routeSegment, index) => {
		const pathSegment = pathSegments[index];
		if (routeSegment.startsWith(":") && isExact && !pathSegment) {
			return false;
		}
		if (pathSegment !== routeSegment && !routeSegment.startsWith(":")) return false;

		return true;
	});
}
