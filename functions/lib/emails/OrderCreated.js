"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderCreated = void 0;
const components_1 = require("@react-email/components");
const react_1 = __importDefault(require("react"));
function OrderCreated() {
    return (react_1.default.createElement(components_1.Section, { className: "py-[16px] text-center" },
        react_1.default.createElement(components_1.Heading, { as: "h1", className: "mb-0 text-[30px] font-semibold leading-[36px]" }, "You left something in your cart"),
        react_1.default.createElement(components_1.Section, { className: "my-[16px] rounded-[8px] border border-solid border-gray-200 p-[16px] pt-0" },
            react_1.default.createElement("table", { className: "mb-[16px]", width: "100%" },
                react_1.default.createElement("tr", null,
                    react_1.default.createElement("th", { className: "border-0 border-b border-solid border-gray-200 py-[8px]" }, "\u00A0"),
                    react_1.default.createElement("th", { align: "left", className: "border-0 border-b border-solid border-gray-200 py-[8px] text-gray-500", colSpan: 6 },
                        react_1.default.createElement(components_1.Text, { className: "font-semibold" }, "Product")),
                    react_1.default.createElement("th", { align: "center", className: "border-0 border-b border-solid border-gray-200 py-[8px] text-gray-500" },
                        react_1.default.createElement(components_1.Text, { className: "font-semibold" }, "Quantity")),
                    react_1.default.createElement("th", { align: "center", className: "border-0 border-b border-solid border-gray-200 py-[8px] text-gray-500" },
                        react_1.default.createElement(components_1.Text, { className: "font-semibold" }, "Price"))),
                react_1.default.createElement("tr", null,
                    react_1.default.createElement("td", { className: "border-0 border-b border-solid border-gray-200 py-[8px]" },
                        react_1.default.createElement(components_1.Img, { alt: "Braun Classic Watch", className: "rounded-[8px] object-cover", height: 110, src: "https://react.email/static/braun-classic-watch.jpg" })),
                    react_1.default.createElement("td", { align: "left", className: "border-0 border-b border-solid border-gray-200 py-[8px]", colSpan: 6 },
                        react_1.default.createElement(components_1.Text, null, "Classic Watch")),
                    react_1.default.createElement("td", { align: "center", className: "border-0 border-b border-solid border-gray-200 py-[8px]" },
                        react_1.default.createElement(components_1.Text, null, "1")),
                    react_1.default.createElement("td", { align: "center", className: "border-0 border-b border-solid border-gray-200 py-[8px]" },
                        react_1.default.createElement(components_1.Text, null, "$210.00"))),
                react_1.default.createElement("tr", null,
                    react_1.default.createElement("td", { className: "border-0 border-b border-solid border-gray-200 py-[8px]" },
                        react_1.default.createElement(components_1.Img, { alt: "Braun Analogue Clock", className: "rounded-[8px] object-cover", height: 110, src: "https://react.email/static/braun-analogue-clock.jpg" })),
                    react_1.default.createElement("td", { align: "left", className: "border-0 border-b border-solid border-gray-200 py-[8px]", colSpan: 6 },
                        react_1.default.createElement(components_1.Text, null, "Analogue Clock")),
                    react_1.default.createElement("td", { align: "center", className: "border-0 border-b border-solid border-gray-200 py-[8px]" },
                        react_1.default.createElement(components_1.Text, null, "1")),
                    react_1.default.createElement("td", { align: "center", className: "border-0 border-b border-solid border-gray-200 py-[8px]" },
                        react_1.default.createElement(components_1.Text, null, "$40.00")))),
            react_1.default.createElement(components_1.Row, null,
                react_1.default.createElement(components_1.Column, { align: "center" },
                    react_1.default.createElement(components_1.Button, { className: "box-border w-full rounded-[8px] bg-indigo-600 px-[12px] py-[12px] text-center font-semibold text-white", href: "https://react.email" }, "Checkout"))))));
}
exports.OrderCreated = OrderCreated;
//# sourceMappingURL=OrderCreated.js.map