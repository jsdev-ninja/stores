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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompanyClient = void 0;
// allow admin create company user
const functions = __importStar(require("firebase-functions/v1"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
exports.createCompanyClient = functions.https.onCall(async (newCompany, context) => {
    var _a, _b, _c;
    const iAdmin = (_a = context.auth) === null || _a === void 0 ? void 0 : _a.token.admin;
    const storeId = (_b = context.auth) === null || _b === void 0 ? void 0 : _b.token.storeId;
    console.log("createCompanyClient", iAdmin, storeId);
    console.log("createCompanyClient new company", newCompany.storeId);
    if (!newCompany) {
        return { success: false };
    }
    // todo:
    // check if user is admin
    // check user storeId equal to client storeId and profile storeId
    const newUser = await firebase_admin_1.default.auth().createUser({
        email: newCompany.email,
        password: newCompany.password,
        emailVerified: true,
        displayName: (_c = newCompany.fullName) !== null && _c !== void 0 ? _c : newCompany.email,
    });
    const { password } = newCompany, profileData = __rest(newCompany, ["password"]);
    await firebase_admin_1.default.firestore().collection("profile").doc(newUser.uid).set(profileData);
    return { success: true, user: newUser, profile: profileData };
});
//# sourceMappingURL=createCompany.js.map