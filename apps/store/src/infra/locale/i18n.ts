import i18n from "i18next";
import { initReactI18next } from "react-i18next";

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
		errors: {
			required_error: "שדה חובה",
			positive: "ערך חייב להיות גדול מ 0",
		},
		common: {
			login: "התחברות",
			logout: "התנתקות",
			city: "עיר",
			street: "רחוב",
			streetNumber: "מס רחוב",
			lang: "שפה",
			name: "שם",
			editProductName: "ערוך שם מוצר",
			sku: 'מק"ט',
			description: "תיאור",
			discount: "הנחה",
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
			weight: "משקל",
			volume: "נפח",
			none: "לא מוגדר",
			liter: "ליטר",
			ml: "מל",
			fullName: "שם מלא",
			email: "אימייל",
			phone: "טלפון",
			floor: "קומה",
			apartmentNumber: "מס דירה",
			password: "סיסמא",
			profitPercentage: "אחוז רווח",
			purchasePrice: "מחיר רכישה",
			dashboard: "ראשי",
			users: "לקוחות",
			products: "מוצרים",
			categories: "קטגוריות",
			orders: "הזמנות",
			settings: "הגדרות",
			amount: "כמות",
			addToFavorite: "הוסף למועדפים",
			remove: "הסר",
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

		paymentSummary: {
			title: "סיכום ההזמנה",
			totalCost: "מחיר סופי",
		},
		// dynamic

		cart: {
			shoppingCart: "סל קניות",
			proceedToCheckout: "המשך לתשלום",
			backToShop: "חזרה לחנות",
		},

		orderSuccessPage: {
			actionButton: "מעבר לחנות",
			title: "ההזמנה שלך התקבלה בהצלחה! תודה רבה על הרכישה שלך.",
			description: "אנו שולחים לך כעת אישור למייל, ונעדכן אותך ברגע שהמוצרים יצאו למשלוח.",
			orderId: "מזהה הזמנה",
			orderCost: "סכום ההזמנה",
			anonymousMessage:
				"רוצה ליהנות מהזמנות מהירות ומבצעים מיוחדים? הירשם עכשיו ותוכל לעקוב אחרי ההזמנות שלך בקלות, לקבל עדכונים על מבצעים בלעדיים, ועוד! 	הצטרף למשפחתנו ותהנה מכל היתרונות.",
		},
		checkout: {
			title: "פרטי ההזמנה",
			order: 'הזמן'
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