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
exports.onUserDelete = exports.onProductUpdate = exports.onProductDelete = exports.onProductCreate = exports.onOrderUpdate = exports.chargeOrder = exports.createPayment = exports.createCompanyClient = exports.getMixpanelData = exports.appInit = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const react_1 = __importDefault(require("react"));
const algoliasearch_1 = __importDefault(require("algoliasearch"));
const email_1 = require("./services/email");
const render_1 = require("@react-email/render");
const OrderCreated_1 = __importDefault(require("./emails/OrderCreated"));
const algolia = (0, algoliasearch_1.default)("633V4WVLUB", "2f3dbcf0c588a92a1e553020254ddb3a");
const index = algolia.initIndex("products");
firebase_admin_1.default.initializeApp({});
var init_1 = require("./api/init");
Object.defineProperty(exports, "appInit", { enumerable: true, get: function () { return init_1.appInit; } });
var mixpanel_ts_1 = require("./api/mixpanel-ts");
Object.defineProperty(exports, "getMixpanelData", { enumerable: true, get: function () { return mixpanel_ts_1.getMixpanelData; } });
var createCompany_1 = require("./api/createCompany");
Object.defineProperty(exports, "createCompanyClient", { enumerable: true, get: function () { return createCompany_1.createCompanyClient; } });
var createPayment_1 = require("./api/createPayment");
Object.defineProperty(exports, "createPayment", { enumerable: true, get: function () { return createPayment_1.createPayment; } });
var chargeOrder_1 = require("./api/chargeOrder");
Object.defineProperty(exports, "chargeOrder", { enumerable: true, get: function () { return chargeOrder_1.chargeOrder; } });
exports.onOrderUpdate = functions.firestore
    .document("/orders/{orderId}")
    .onUpdate(async (snap, context) => {
    const { orderId } = context.params;
    const after = snap.after.data();
    const before = snap.before.data();
    const orderIsPaid = after.paymentStatus === "completed" && before.paymentStatus === "pending";
    if (orderIsPaid) {
        console.log("order paid", orderId);
        const html = await (0, render_1.render)(react_1.default.createElement(OrderCreated_1.default, { order: after }));
        await email_1.emailService.sendEmail({
            html,
        });
        return firebase_admin_1.default.firestore().collection("cart").doc(after.cart.id).update({
            status: "completed",
        });
    }
    return;
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
    .onDelete(async (snap) => {
    return await index.deleteObject(snap.id);
});
exports.onProductUpdate = functions.firestore
    .document("/products/{productId}")
    .onUpdate(async (snap, context) => {
    const after = snap.after.data();
    const { productId } = context.params;
    return await index.saveObject(Object.assign({ objectID: productId, id: productId }, after));
});
exports.onUserDelete = functions.auth.user().onDelete((user) => {
    console.info("user deleted", user.uid, user.displayName, user.email);
    const uid = user.uid; // The UID of the user.
    const db = firebase_admin_1.default.firestore();
    return db
        .collection("profiles")
        .doc(uid)
        .delete()
        .then(() => {
        console.log("User document deleted in Firestore");
    })
        .catch((error) => {
        console.error("Error deleting user document in Firestore", error);
    });
});
//# sourceMappingURL=index.js.map