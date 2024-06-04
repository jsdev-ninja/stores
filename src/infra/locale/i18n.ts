import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)

export const defaultNS = "common";

export const resources = {
	en: {
		common: {
			"Welcome to React": "Welcome to React and react-i18next",

			categories: {
				frozenFruitsAndVegetables: "Frozen Fruits and Vegetables",
				breadsAndBakeryProducts: "Breads and Bakery Products",
				dairyAndEggs: "Dairy and Eggs",
				delicatessen: "Delicatessen",
				beveragesAndWine: "Beverages and Wine",
				groceryItems: "Grocery Items",
				snacksAndSweets: "Snacks and Sweets",
				pharmacyHygieneAndBabies: "Pharmacy, Hygiene, and Babies",
				cleaningMaterials: "Cleaning Materials",
				householdUtensilsAndGadgets: "Household Utensils and Gadgets",

				pastramiAndSausages: "Pastrami and Sausages",
				sausages: "Sausages",
				drySausages: "Dry Sausages",
				salads: "Salads",
				desserts: "Desserts",
			},
		},
	},
	he: {
		common: {
			"Welcome to React": "שלום לכולם",
			categories: {
				frozenFruitsAndVegetables: "פרות וירקות קפואים",
				breadsAndBakeryProducts: "לחמים ומוצרי מאפה",
				dairyAndEggs: "מוצרי חלב וביצים",
				delicatessen: "מעדניה",
				beveragesAndWine: "משקאות ויין",
				groceryItems: "דברי מכולת",
				snacksAndSweets: "חטיפים וממתקים",
				pharmacyHygieneAndBabies: "פארם היגיינה ותינוקות",
				cleaningMaterials: "חומרי ניקוי",
				householdUtensilsAndGadgets: "כלי בית וג'אדג'טים",

				pastramiAndSausages: "פסטרמה ונקניקים",
				sausages: "נקניקיות",
				drySausages: "נקניקים יבשים",
				salads: "סלטים",
				desserts: "קינוחים",
			},
		},
	},
};

i18n
	.use(initReactI18next) // passes i18n down to react-i18next
	.init({
		defaultNS,
		resources,
		lng: "he", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
		// you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
		// if you're using a language detector, do not define the lng option

		interpolation: {
			escapeValue: false, // react already safes from xss
		},
		ns: ["common"],
		debug: true,
	});

export { i18n };

console.log(i18n);

