export function replaceParamsInPath(path: string, params?: object) {
	if (!params) return path;

	let newPath = path;

	Object.entries(params).forEach(([paramName, paramValue]) => {
		newPath = newPath.replace(`:${paramName}`, paramValue);
	});

	return newPath;
}

export function comparePathWithRoutePath(path: string, routePath: string, exact?: boolean) {
	const pathSegments = path.split("/");
	const routePathSegments = routePath.split("/");

	const isExact = exact ?? true;
	console.log("routePathSegments", routePathSegments, pathSegments, isExact);

	if (pathSegments.length !== routePathSegments.length && isExact) return false;

	return routePathSegments.every((routeSegment, index) => {
		const pathSegment = pathSegments[index];
		if (pathSegment === routeSegment) return true;
		if (routeSegment.startsWith(":")) return true;
		return false;
	});
}
