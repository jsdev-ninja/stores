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
// mark product that used in discount
// get final price for product and discount id
// filter better discount
// main
export function getCartCost({ cart, discounts, store, }) {
    const { isVatIncludedInPrice } = store;
    let result = cart.map((item) => {
        return {
            amount: item.amount,
            product: { ...item.product },
            originalPrice: item.product.price,
            finalPrice: getPriceAfterDiscount(item.product),
            finalDiscount: calculateDiscount(item.product),
        };
    });
    // calculate delivery price before
    // check if cart cost is greater than free delivery price
    const activeDiscounts = discounts.filter((discount) => {
        if (discount.variant.variantType === "bundle") {
            const productsTotal = cart?.reduce((total, item) => {
                if (discount.variant.productsId.includes(item.product.id)) {
                    total += item.amount;
                    return total;
                }
                return total;
            }, 0) ?? 0;
            if (productsTotal >= discount.variant.requiredQuantity) {
                // const times = Math.floor(productsTotal / discount.variant.requiredQuantity);
                // console.log("yes", times, discount.variant.discountPrice);
                return true;
            }
        }
        return false;
    });
    console.log("activeDiscounts", activeDiscounts);
    activeDiscounts.forEach((discount) => {
        if (discount.variant.variantType === "bundle") {
            // get all products in cart
            const products = cart.filter((item) => discount.variant.productsId.includes(item.product.id));
            const productsTotal = products?.reduce((total, item) => {
                if (discount.variant.productsId.includes(item.product.id)) {
                    total += item.amount;
                    return total;
                }
                return total;
            }, 0) ?? 0;
            const times = Math.floor(productsTotal / discount.variant.requiredQuantity);
            const price = getPriceAfterDiscount(products[0]?.product);
            const _discount = calculateDiscount(products[0]?.product);
            console.log("price", price, _discount);
            const discountPrice = Number((discount.variant.discountPrice / discount.variant.requiredQuantity).toFixed(2)) * 1;
            console.log("discountPrice", discountPrice);
            const totalDiscount = (price * discount.variant.requiredQuantity - discount.variant.discountPrice) * times;
            const originalPrice = productsTotal * price;
            const discountPriceFinal = originalPrice - totalDiscount;
            const averagePrice = Number((discountPriceFinal / productsTotal).toFixed(2));
            result = result.map((item) => {
                if (discount.variant.productsId.includes(item.product.id)) {
                    return {
                        ...item,
                        finalPrice: averagePrice,
                        originalPrice: item.product.price,
                        discountPrice: price,
                        finalDiscount: item.finalDiscount + (item.product.price - averagePrice),
                    };
                }
                return item;
            });
            // find average price
        }
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
        acc.cost += amount * finalPrice;
        acc.discount += finalDiscount ? amount * finalDiscount : finalDiscount;
        acc.finalCost += amount * finalPrice + (isVatIncludedInPrice ? 0 : productVatValue);
        acc.productsCost += amount * finalPrice + (isVatIncludedInPrice ? 0 : productVatValue);
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
