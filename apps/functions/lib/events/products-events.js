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
exports.updateProductsCategory = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
exports.updateProductsCategory = functions.https.onRequest(async (req, res) => {
    try {
        const db = firebase_admin_1.default.firestore();
        const size = 500;
        // const categories = [
        // 	{
        // 		id: 1,
        // 		name: "products",
        // 		children: [
        // 			{
        // 				name: "fruits",
        // 			},
        // 		],
        // 	},
        // 	{
        // 		id: 1,
        // 		name: "goods",
        // 		children: [
        // 			{
        // 				name: "to eat",
        // 			},
        // 		],
        // 	},
        // ];
        const productsRef = db.collection("test");
        const shapshot = await productsRef.count().get();
        await productsRef.add({
            name: "lemon",
            "categories.lvl0": ["products", "goods"],
            "categories.lvl1": ["products > fruits", "goods > to eat"],
        });
        await productsRef.add({
            name: "banana",
            "categories.lvl0": ["products"],
            "categories.lvl1": ["products > fruits"],
        });
        const allDocsSize = shapshot.data().count;
        const total = Math.ceil(allDocsSize / size);
        for (let i = 0; i < total; i++) {
            const batch = db.batch();
            const products = await productsRef
                .limit(size)
                .offset(i + size)
                .get();
            products.forEach((product) => {
                const id = product.id;
                const data = product.data();
                console.log("data", data);
                const docRef = db.collection("products").doc(id);
                batch.update(docRef, { population: 1000000 });
            });
            await batch.commit();
        }
        res.json({ message: "success", count: shapshot.data().count });
    }
    catch (error) {
        res.json(error);
    }
});
//# sourceMappingURL=products-events.js.map