import { DiscountEngine } from "../entities/Discount/engine";
const CONFIG = {
    VAT: 18,
};
function calculateDiscount(product) {
    if (product.discount?.type === "percent") {
        return (product.price * (product.discount.value ?? 100)) / 100;
    }
    if (product.discount?.type === "number") {
        return product.discount.value ?? 0;
    }
    return 0;
}
function getPriceAfterDiscount(product) {
    if (product.discount?.type === "percent") {
        const dscountAmount = (product.price * product.discount.value) / 100;
        return product.price - dscountAmount;
    }
    if (product.discount?.type === "number") {
        const dscountAmount = product.price - product.discount.value;
        return dscountAmount;
    }
    return product.price;
}
// main
export function getCartCost({ cart, discounts, store, }) {
    const { isVatIncludedInPrice } = store;
    // Convert cart items to the format expected by the discount engine
    const cartForEngine = cart.map(item => ({
        amount: item.amount,
        product: {
            id: item.product.id,
            price: item.product.price,
        },
    }));
    // Apply discounts using the new discount engine
    const discountResult = DiscountEngine.calculateDiscounts(cartForEngine, discounts);
    console.log("discountResult", discountResult);
    // Map the results back to the original format with additional product info
    const result = cart.map((item, index) => {
        const engineItem = discountResult.items[index];
        return {
            amount: item.amount,
            product: { ...item.product },
            originalPrice: item.product.price,
            finalPrice: engineItem ? engineItem.finalPrice : getPriceAfterDiscount(item.product),
            finalDiscount: engineItem ? engineItem.finalDiscount : calculateDiscount(item.product),
        };
    });
    const cartDetails = result.reduce((acc, item) => {
        const { product, amount, finalPrice, finalDiscount } = item;
        let productVatValue = 0;
        if (product.vat) {
            let vat = 0;
            if (isVatIncludedInPrice) {
                const vat_amount = finalPrice * (CONFIG.VAT / (100 + CONFIG.VAT));
                productVatValue = Number(vat_amount.toFixed(2));
                productVatValue = productVatValue * amount;
                vat = Number(productVatValue.toFixed(2));
            }
            else {
                productVatValue = (finalPrice * CONFIG.VAT) / 100;
                productVatValue = productVatValue * amount;
                vat = Number(productVatValue.toFixed(2));
            }
            acc.vat = Number((acc.vat + vat).toFixed(2));
        }
        // Round finalPrice to prevent floating point errors from discount engine
        const roundedFinalPrice = Number(finalPrice.toFixed(2));
        acc.cost += amount * roundedFinalPrice;
        acc.discount += finalDiscount ? amount * finalDiscount : finalDiscount;
        acc.finalCost += amount * roundedFinalPrice + (isVatIncludedInPrice ? 0 : productVatValue);
        acc.productsCost += amount * roundedFinalPrice + (isVatIncludedInPrice ? 0 : productVatValue);
        // Round all accumulated values to prevent floating point errors
        acc.cost = Number(acc.cost.toFixed(2));
        acc.discount = Number(acc.discount.toFixed(2));
        acc.finalCost = Number(acc.finalCost.toFixed(2));
        acc.productsCost = Number(acc.productsCost.toFixed(2));
        return acc;
    }, {
        discount: 0,
        cost: 0,
        finalCost: 0,
        vat: 0,
        productsCost: 0,
        deliveryPrice: store?.deliveryPrice ?? 0,
    });
    if (cartDetails.deliveryPrice && cartDetails.productsCost >= (store.freeDeliveryPrice ?? 0)) {
        cartDetails.deliveryPrice = 0;
    }
    else {
        cartDetails.finalCost += cartDetails.deliveryPrice;
    }
    console.log("cartDetails", cartDetails);
    return { items: result, ...cartDetails };
}
