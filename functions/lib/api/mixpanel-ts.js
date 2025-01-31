"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMixpanelData = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const stores = ["tester-store", "opal-market-store"];
const baseUrl = "https://eu.mixpanel.com/api/query/insights";
async function getData({ workspaceId, bookmarkId }) {
    const options = {
        method: "GET",
        headers: {
            accept: "application/json",
            authorization: "Basic OWM5NWIxZWZkOGI2Y2VmYmRmZDI1NmQ2NzdhNzg0OGQ6", // todo
        },
    };
    const url = baseUrl + `?project_id=2965387&workspace_id=${workspaceId}&bookmark_id=${bookmarkId}`;
    const response = await (0, axios_1.default)(url, options);
    return response.data;
}
exports.getMixpanelData = functions.pubsub.schedule("every 1 hours").onRun(async () => {
    var _a, _b, _c;
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
        const batch = firebase_admin_1.default.firestore().batch();
        const totalPageView = totalPageViewResult.series.totalPageView;
        const totalUsers = totalUsersResult.series.totalUsers;
        const visitors = (_a = visitorsResult.series) === null || _a === void 0 ? void 0 : _a.visitors;
        const visitorsBefore = (_c = (_b = visitorsResult.time_comparison) === null || _b === void 0 ? void 0 : _b.series) === null || _c === void 0 ? void 0 : _c.visitors;
        stores.forEach((storeId) => {
            const storeStats = {};
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
            batch.set(firebase_admin_1.default.firestore().doc(`store-stats/${storeId}`), storeStats, { merge: true });
        });
        return await batch.commit();
    }
    catch (error) {
        console.log("error", error.message);
    }
    return null;
});
//# sourceMappingURL=mixpanel-ts.js.map