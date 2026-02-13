export function replaceParamsInPath(path: string, params?: object) {
	if (!params) return removeDynamicSegments(path);

	let newPath = path;

	Object.entries(params).forEach(([paramName, paramValue]) => {
		if (!paramValue) return;
		newPath = newPath.replace(`:${paramName}`, paramValue);
	});

	return removeDynamicSegments(newPath);
}

function removeDynamicSegments(url: string) {
	const [base, ...segments] = url.split("/");
	const filtered = segments.filter((seg) => !seg.startsWith(":"));
	return [base, ...filtered].join("/");
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
