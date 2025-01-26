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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayment = void 0;
const functions = __importStar(require("firebase-functions/v1"));
// import admin from "firebase-admin";
function objectToQueryParams(obj) {
    return Object.keys(obj)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join("&");
}
const getProductFinalPrice = (product) => {
    if (!product)
        return 0;
    const hasDiscount = product.discount.type !== "none";
    const discount = hasDiscount
        ? product.discount.type === "number"
            ? product.discount.value
            : (product.price * product.discount.value) / 100
        : 0;
    console.log("discount", discount);
    let price = 0;
    price = product.price - discount;
    if (product.vat) {
        const productVatValue = (product.price * 18) / 100;
        console.log("productVatValue", productVatValue, price);
        price += productVatValue;
    }
    return parseFloat(price.toFixed(2));
};
// HYP BUGS
// 1) success pay twice on same order
// 5326105300985614
// 12/25
// 125
// 890108566
exports.createPayment = functions.https.onCall(async (data, context) => {
    try {
        console.log("createPayment", context.rawRequest.headers.origin);
        console.log("create payment data", JSON.stringify(data));
        const { order } = data;
        const items = order.cart.items.map((item) => `[${item.product.sku}~${item.product.name[0].value}~${item.amount}~${getProductFinalPrice(item.product)}]`);
        const params = {
            PassP: "hyp1234",
            KEY: "81057eb786ffc379de89d860031e8fea0e4d28f2",
            Masof: "0010302921",
            action: "APISign",
            What: "SIGN",
            Order: order.id,
            Info: "test-api",
            Amount: order.cart.cartTotal,
            UTF8: "True",
            UTF8out: "True",
            UserId: "203269535",
            ClientName: "Israel",
            ClientLName: "Isareli",
            street: "levanon+3",
            city: "netanya",
            zip: "42361",
            phone: "098610338",
            cell: "050555555555",
            email: "test@yaad.net",
            Tash: "2",
            FixTash: "False",
            ShowEngTashText: "False",
            Coin: "1",
            Postpone: "False",
            J5: "False",
            MoreData: "True",
            sendemail: "True",
            SendHesh: "True",
            heshDesc: items.join(""),
            Pritim: "True",
            PageLang: "HEB",
            tmp: "1",
            Sign: "True",
        };
        const queryString = objectToQueryParams(params);
        const url = `https://pay.hyp.co.il/p/?${queryString}`;
        const res = await fetch(url);
        const body = await res.text();
        return {
            paymentLink: `https://pay.hyp.co.il/p/?action=pay&${body}`,
        };
    }
    catch (error) {
        console.error(error.message);
        return null;
    }
});
//# sourceMappingURL=createPayment.js.map