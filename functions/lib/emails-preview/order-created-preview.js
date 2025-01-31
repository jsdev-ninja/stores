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
const React = __importStar(require("react"));
const OrderCreated_1 = __importDefault(require("../emails/OrderCreated"));
const testOrder = {
    address: {
        apartmentEnterNumber: "1",
        apartmentNumber: "1",
        city: "רמת גן",
        country: "ישראל",
        floor: "1",
        street: "הראה",
        streetNumber: "58",
    },
    paymentStatus: "completed",
    cart: {
        cartDiscount: 100,
        cartTotal: 200,
        cartVat: 18,
        id: "",
        items: [
            {
                amount: 3,
                product: {
                    brand: "תנובה",
                    categories: {},
                    categoryList: null,
                    images: [
                        {
                            id: "",
                            url: "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?q=80&w=2156&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                        },
                    ],
                    name: [{ lang: "he", value: "חלב" }],
                    price: 9.9,
                },
            },
        ],
    },
    client: {
        displayName: "יוסי חיים",
    },
    companyId: "",
    date: Date.now(),
    id: "",
    status: "pending",
    storeId: "",
    type: "Order",
    userId: "",
    deliveryDate: 0,
};
function OrderCreated2() {
    return React.createElement(OrderCreated_1.default, { order: testOrder });
}
exports.default = OrderCreated2;
//# sourceMappingURL=order-created-preview.js.map