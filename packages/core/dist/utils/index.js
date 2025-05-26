const CONFIG = {
    VAT: 18,
};
function calculateDiscount(product) {
    if (product.discount?.type === "percent") {
        return (product.price * (product.discount.value ?? 100)) / 100;
    }
    if (product.discount?.type === "number") {
        return product.price - (product.discount.value ?? 0);
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
    let result = cart.map((item) => {
        return {
            amount: item.amount,
            product: { ...item.product },
            originalPrice: item.product.price,
            finalPrice: item.product.price,
            finalDiscount: 0,
        };
    });
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
            console.log("totalDiscount", totalDiscount);
            console.log("discountPriceFinal", discountPriceFinal, originalPrice);
            const averagePrice = Number((discountPriceFinal / productsTotal).toFixed(2));
            console.log("averagePrice", averagePrice);
            result = result.map((item) => {
                if (discount.variant.productsId.includes(item.product.id)) {
                    return {
                        ...item,
                        finalPrice: averagePrice,
                        originalPrice: item.product.price,
                        discountPrice: price,
                        finalDiscount: item.product.price - averagePrice,
                    };
                }
                return item;
            });
            console.log("averagePrice", averagePrice);
            console.log("yes", times, discount.variant.requiredQuantity, discount.variant.discountPrice);
            console.log("dis", productsTotal, products);
            // find average price
        }
    });
    console.log("result", result);
    const cartDetails = result.reduce((acc, item) => {
        const { product, amount, finalPrice, finalDiscount } = item;
        console.log("isVatIncludedInPrice", isVatIncludedInPrice);
        let productVatValue = 0;
        if (product.vat) {
            if (isVatIncludedInPrice) {
                const vat_amount = finalPrice * (CONFIG.VAT / (100 + CONFIG.VAT));
                productVatValue = Number(vat_amount.toFixed(2));
                productVatValue = productVatValue * amount;
                acc.vat += Number(productVatValue.toFixed(2));
            }
            else {
                productVatValue = (finalPrice * CONFIG.VAT) / 100;
                productVatValue = productVatValue * amount;
                acc.vat += Number(productVatValue.toFixed(2));
            }
        }
        console.log("finalDiscount", finalDiscount);
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
