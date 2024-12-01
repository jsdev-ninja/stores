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
const components_1 = require("@react-email/components");
const React = __importStar(require("react"));
const content = {
    title_client: "הזמנה שלך התקבלה בהצלחה",
};
function OrderCreated({ order }) {
    if (!order)
        return null;
    return (React.createElement(components_1.Html, { dir: "rtl", lang: "he" },
        React.createElement(components_1.Container, null,
            React.createElement(components_1.Text, { style: { textAlign: "center" } }, content.title_client),
            order.cart.items.map((item, i) => {
                var _a, _b, _c;
                return (React.createElement(components_1.Row, { key: i },
                    React.createElement(components_1.Column, null,
                        React.createElement(components_1.Img, { src: (_c = (_b = (_a = item.product.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) !== null && _c !== void 0 ? _c : "", alt: "product", width: "50", height: "50" })),
                    React.createElement(components_1.Column, null, item.product.name[0].value),
                    React.createElement(components_1.Column, null,
                        item.product.price,
                        " * ",
                        item.amount),
                    React.createElement(components_1.Column, null, Number(item.product.price * item.amount).toFixed(2))));
            }))));
}
exports.default = OrderCreated;
//# sourceMappingURL=OrderCreated.js.map