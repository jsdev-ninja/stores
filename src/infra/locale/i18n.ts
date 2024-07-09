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
		},
		auth: {
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
