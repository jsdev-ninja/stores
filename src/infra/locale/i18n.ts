import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)

export const defaultNS = "common";

export const resources = {
	en: {
		common: {
			login: "login",
			logout: "logout",
		},
		store: {},
		admin: {},
	},
	he: {
		// static
		common: {
			login: "התחברות",
			logout: "התנתקות",
			city: "עיר",
			street: "רחוב",
			lang: "שפה",
			name: "שם",
			editProductName: "ערוך שם מוצר",
			sku: 'מק"ט',
			description: "תיאור",
			price: "מחיר",
			selectCategory: "בחר קטגוריה",
			category: "קטגוריה",
			priceType: "סוג מחיר",
			enterPriceType: "הכנס סוג מחיר",
			unit: "יחידה",
			kg: "קג",
			gram: "גרם",
			brand: "מותג",
			manufacturer: "יצרן",
			supplier: "יבואן",
			image: "תמונה",
			vat: 'מע"מ',
		},
		auth: {
			welcome: {
				login: {
					title: "חזרת לעוד שופינג?",
					description: "הכנס את פרטיך ותחזור לקנייה. העגלה שלך מתגעגעת אליך!",
					button: "עדיין לא רשום? הצטרף עכשיו!",
				},
				signup: {
					title: "קונה חדש בשכונה?",
					description:
						"הצטרף אלינו ופתח עולם של מבצעים מדהימים. מלא את פרטיך ונתחיל את ההרפתקה הזו!",
					button: "כבר רשום? התחבר כאן!",
				},
			},
			form: {
				errors: {
					invalidEmail: "אימייל לא תקין",
					codes: {
						"auth/invalid-credential": "אימייל או סיסמה לא נכונים",
					},
				},
				email: {
					label: "אימייל",
					placeholder: " הכנס אימייל",
				},
				password: {
					label: "סיסמה",
					placeholder: " הכנס סיסמה",
				},
			},
		},
		// dynamic
		checkout: {
			title: "ביצוע תשלום",
		},
		store: {},
		admin: {
			addProductPage: {
				title: "הוסף מוצר",
			},
			productForm: {
				edit: {
					title: "ערוך מוצר",
				},
				add: {
					title: "הוסף מוצר",
				},
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
