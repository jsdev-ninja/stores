"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformProduct = exports.ProductAlgoliaSchema = exports.ProductSchema = exports.TFlattenCategorySchema = exports.CategorySchema = exports.BaseCategorySchema = exports.LocaleSchema = void 0;
const zod_1 = require("zod");
exports.LocaleSchema = zod_1.z.object({
    lang: zod_1.z.string().min(1),
    value: zod_1.z.string().min(1),
});
exports.BaseCategorySchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    companyId: zod_1.z.string().min(1),
    storeId: zod_1.z.string().min(1),
    parentId: zod_1.z.string().nullish(),
    tag: zod_1.z.string().min(1),
    locales: zod_1.z.array(exports.LocaleSchema),
});
exports.CategorySchema = exports.BaseCategorySchema.extend({
    children: zod_1.z.lazy(() => exports.CategorySchema.array()),
});
exports.TFlattenCategorySchema = exports.BaseCategorySchema.extend({
    index: zod_1.z.number(),
    depth: zod_1.z.number(),
    collapsed: zod_1.z.boolean().optional(),
    children: zod_1.z.array(exports.CategorySchema),
});
const text = zod_1.z.string();
exports.ProductSchema = zod_1.z.object({
    type: zod_1.z.literal("Product"),
    storeId: text,
    companyId: text,
    id: zod_1.z.string(),
    sku: zod_1.z.string().min(1),
    description: zod_1.z.string(),
    vat: zod_1.z.boolean(),
    priceType: zod_1.z.object({
        type: zod_1.z.enum(["unit", "kg", "gram", "liter", "ml"]),
        value: zod_1.z.number(),
    }),
    price: zod_1.z.number(),
    currency: zod_1.z.literal("ILS"),
    discount: zod_1.z.object({
        type: zod_1.z.enum(["number", "percent", "none"]),
        value: zod_1.z.number(),
    }),
    weight: zod_1.z.object({
        value: zod_1.z.number(),
        unit: zod_1.z.enum(["kg", "gram", "none"]),
    }),
    volume: zod_1.z.object({
        value: zod_1.z.number(),
        unit: zod_1.z.enum(["liter", "ml", "none"]),
    }),
    images: zod_1.z.array(zod_1.z.object({ url: zod_1.z.string().url(), id: zod_1.z.string() })),
    locales: zod_1.z.array(exports.LocaleSchema),
    manufacturer: text,
    brand: zod_1.z.string(),
    importer: zod_1.z.string(),
    supplier: zod_1.z.string(),
    ingredients: zod_1.z.array(exports.LocaleSchema),
    // algolia
    categories: zod_1.z.object({
        lvl0: zod_1.z.array(zod_1.z.string()),
        lvl1: zod_1.z.array(zod_1.z.string()),
        lvl2: zod_1.z.array(zod_1.z.string()),
        lvl3: zod_1.z.array(zod_1.z.string()),
        lvl4: zod_1.z.array(zod_1.z.string()),
    }),
    categoryList: zod_1.z.array(exports.CategorySchema),
});
exports.ProductAlgoliaSchema = zod_1.z.object({
    type: zod_1.z.literal("Product"),
    storeId: text,
    companyId: text,
    id: zod_1.z.string(),
    objectID: zod_1.z.string(),
    sku: zod_1.z.string().min(1),
    description: zod_1.z.string(),
    vat: zod_1.z.boolean(),
    priceType: zod_1.z.enum(["unit", "kg", "gram", "liter", "ml"]),
    priceAmount: zod_1.z.number(),
    price: zod_1.z.number(),
    currency: zod_1.z.literal("ILS"),
    discountPrice: zod_1.z.number(),
    discountType: zod_1.z.enum(["number", "percent", "none"]),
    weight: zod_1.z.string(),
    volume: zod_1.z.string(),
    image: zod_1.z.string().url(),
    name: zod_1.z.string(),
    manufacturer: text,
    brand: zod_1.z.string(),
    importer: zod_1.z.string(),
    supplier: zod_1.z.string(),
    ingredients: zod_1.z.array(zod_1.z.string()),
    categories: zod_1.z.object({
        lvl0: zod_1.z.array(zod_1.z.string()),
        lvl1: zod_1.z.array(zod_1.z.string()),
        lvl2: zod_1.z.array(zod_1.z.string()),
        lvl3: zod_1.z.array(zod_1.z.string()),
        lvl4: zod_1.z.array(zod_1.z.string()),
    }),
    categoryList: zod_1.z.array(zod_1.z.string()),
});
function transformProduct(product) {
    var _a, _b;
    return {
        type: product.type,
        id: product.id,
        objectID: product.id,
        sku: product.sku,
        storeId: product.storeId,
        companyId: product.companyId,
        price: product.price,
        currency: product.currency,
        brand: product.brand,
        categories: product.categories,
        categoryList: product.categoryList.map((c) => c.locales[0].value),
        description: product.description,
        discountPrice: product.discount.value,
        discountType: product.discount.type,
        image: (_b = (_a = product.images[0]) === null || _a === void 0 ? void 0 : _a.url) !== null && _b !== void 0 ? _b : "",
        importer: product.importer,
        ingredients: product.ingredients.map((i) => i.value),
        manufacturer: product.manufacturer,
        name: product.locales[0].value,
        priceAmount: product.priceType.value,
        priceType: product.priceType.type,
        supplier: product.supplier,
        vat: product.vat,
        volume: product.volume.unit !== "none" ? `${product.volume.value} ${product.volume.unit}` : "",
        weight: product.weight.unit !== "none" ? `${product.weight.value} ${product.weight.unit}` : "",
    };
}
exports.transformProduct = transformProduct;
//# sourceMappingURL=product.js.map