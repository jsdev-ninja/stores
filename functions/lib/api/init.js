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
exports.appInit = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.appInit = functions.https.onCall(async (data, context) => {
    console.log("init", context.rawRequest.headers.origin);
    // http://localhost:5173
    const origin = context.rawRequest.headers.origin;
    const db = firebase_admin_1.default.firestore();
    const companiesRef = db
        .collection("companies")
        .where("websiteDomains", "array-contains", origin);
    const companies = await companiesRef.get();
    console.log("init found companies:", companies.size);
    const doc = companies.docs[0];
    const company = doc.data();
    company.id = doc.id;
    // store
    const storesRef = db
        .collection("stores")
        .where("companyId", "==", doc.id)
        .where("urls", "array-contains", origin);
    const stores = await storesRef.get();
    console.log("init found stores:", stores.size);
    const storeDoc = stores.docs[0];
    const store = storeDoc.data();
    store.id = storeDoc.id;
    return { company, store };
});
//# sourceMappingURL=init.js.map