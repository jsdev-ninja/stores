import { math } from "../math/math";



// default is margin not markup
export const storeCalculator = {
    calcSalePriceFromMargin: (margin: number, purchasePrice: number) => {
        if (margin <= 0 || purchasePrice <= 0 || margin >= 100) return purchasePrice;
        return math.round(purchasePrice / (1 - margin / 100));
    },
    calcMarginFromSalePrice: (salePrice: number, purchasePrice: number) => {
        if (salePrice <= 0 || purchasePrice <= 0) return 0;
        return math.round(((salePrice - purchasePrice) / salePrice) * 100);
    }
}
