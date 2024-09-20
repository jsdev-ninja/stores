import * as functions from "firebase-functions/v1";
import admin from "firebase-admin";

import axios from "axios";

const stores = ["tester-store", "opal-market-store"];

const baseUrl = "https://eu.mixpanel.com/api/query/insights";

async function getData({ workspaceId, bookmarkId }: { workspaceId: string; bookmarkId: string }) {
	const options = {
		method: "GET",
		headers: {
			accept: "application/json",
			authorization: "Basic OWM5NWIxZWZkOGI2Y2VmYmRmZDI1NmQ2NzdhNzg0OGQ6", // todo
		},
	};
	const url =
		baseUrl + `?project_id=2965387&workspace_id=${workspaceId}&bookmark_id=${bookmarkId}`;
	const response = await axios(url, options);
	return response.data;
}

export const getMixpanelData = functions.pubsub.schedule("every 1 hour").onRun(async () => {
	console.log("function: get mixpanel data for stores");
	try {
		const [totalPageViewResult, totalUsersResult, visitorsResult] = await Promise.all([
			// page view
			getData({
				workspaceId: "3485179",
				bookmarkId: "62416043",
			}),
			// total users (todo: get form firebase)
			getData({
				workspaceId: "3485179",
				bookmarkId: "62485521",
			}),
			// visitors (session start)
			getData({
				workspaceId: "3485179",
				bookmarkId: "62623268",
			}),
		]);

		const batch = admin.firestore().batch();

		const totalPageView = totalPageViewResult.series.totalPageView;
		const totalUsers = totalUsersResult.series.totalUsers;

		const visitors = visitorsResult.series?.visitors;
		const visitorsBefore = visitorsResult.time_comparison?.series?.visitors;

		stores.forEach((storeId) => {
			const storeStats: any = {};
			totalPageView[storeId];

			if (visitorsBefore && visitorsBefore[storeId]) {
				storeStats.storeVisitorsBefore = visitorsBefore[storeId];
			}
			if (visitors && visitors[storeId]) {
				storeStats.storeVisitors = visitors[storeId];
			}

			if (totalUsers[storeId]) {
				storeStats.totalUsers = totalUsers[storeId];
			}
			if (totalPageView[storeId]) {
				storeStats.totalPageView = totalPageView[storeId];
			}
			console.log(storeId, JSON.stringify(storeStats));

			batch.set(admin.firestore().doc(`store-stats/${storeId}`), storeStats, { merge: true });
		});
		return await batch.commit();
	} catch (error: any) {
		console.log("error", error.message);
	}
	return null;
});
