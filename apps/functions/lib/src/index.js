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
exports.onUserCreate = exports.onProductUpdate = exports.onProductDelete = exports.onProductCreate = exports.onOrderCreate = exports.getPageView = exports.appInit = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const algoliasearch_1 = __importDefault(require("algoliasearch"));
const email_1 = require("./services/email");
const mixpaneldevdocs_1 = __importDefault(require("../.api/apis/mixpaneldevdocs"));
const algolia = (0, algoliasearch_1.default)("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");
const index = algolia.initIndex("products");
firebase_admin_1.default.initializeApp({});
var init_1 = require("./api/init");
Object.defineProperty(exports, "appInit", { enumerable: true, get: function () { return init_1.appInit; } });
exports.getPageView = functions.https.onCall(async () => {
    mixpaneldevdocs_1.default.auth("9c95b1efd8b6cefbdfd256d677a7848d");
    return mixpaneldevdocs_1.default
        .insightsQuery({ project_id: 2965387, workspace_id: 3485179, bookmark_id: 62416043 })
        .then(({ data }) => console.log(data))
        .catch((err) => console.error(err));
});
exports.onOrderCreate = functions.firestore
    .document("/orders/{orderId}")
    .onCreate(async (snap) => {
    const order = Object.assign(Object.assign({}, snap.data()), { id: snap.id });
    const cardId = order.cartId;
    await email_1.emailService.sendEmail();
    return firebase_admin_1.default.firestore().collection("cart").doc(cardId).update({
        status: "completed",
    });
});
exports.onProductCreate = functions.firestore
    .document("/products/{productId}")
    .onCreate(async (snap, context) => {
    var _a;
    console.log(snap.data(), snap.id, snap.createTime);
    console.log("AUTH", context.authType, (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid);
    return await index.saveObject(Object.assign(Object.assign({}, snap.data()), { id: snap.id, objectID: snap.id }));
});
exports.onProductDelete = functions.firestore
    .document("/products/{productId}")
    .onDelete(async (snap, context) => {
    console.log(snap.data(), snap.id, snap.createTime);
    console.log(context);
    return await index.deleteObject(snap.id);
});
exports.onProductUpdate = functions.firestore
    .document("/products/{productId}")
    .onUpdate(async (snap, context) => {
    const before = snap.before.data();
    const after = snap.after.data();
    const { productId } = context.params;
    console.log("update ", productId, after, before);
    return await index.saveObject(Object.assign({ objectID: productId, id: productId }, after));
});
exports.onUserCreate = functions.auth.user().onCreate((user) => {
    console.info("user created", user.uid, user.displayName, user.email);
    const email = user.email; // The email of the user.
    const displayName = user.displayName; // The display name of the user.
    const uid = user.uid; // The UID of the user.
    // Example: Add the user to Firestore
    const db = firebase_admin_1.default.firestore();
    return db
        .collection("users")
        .doc(uid)
        .set({
        email: email,
        displayName: displayName || email,
        createdAt: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
    })
        .then(() => {
        console.log("User document created in Firestore");
    })
        .catch((error) => {
        console.error("Error creating user document in Firestore", error);
    });
});
//# sourceMappingURL=index.js.map