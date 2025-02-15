const masofData = {
	PassP: "hyp1234",
	KEY: "81057eb786ffc379de89d860031e8fea0e4d28f2",
	Masof: "0010302921",
};

async function main() {
	// STEP 1 - create payment link

	const params = {
		...masofData,
		What: "SIGN",
		action: "APISign",
		Order: "12345678910",
		Info: "test-api",
		Amount: 10,
		UTF8: "True",
		UTF8out: "True",
		UserId: 203269535,
		ClientName: "Israel",
		ClientLName: "Isareli",
		street: "levanon 3",
		city: "netanya",
		zip: 42361,
		phone: "098610338",
		cell: "050555555555",
		email: "philipbrodovsky@gmail.com",
		Tash: 1,
		FixTash: false,
		ShowEngTashText: false,
		Coin: 1,
		Postpone: false,
		J5: "True",
		MoreData: "True",
		Sign: "True",
		sendemail: "True",
		SendHesh: "True",
		heshDesc: "[0~Item 1~1~8][0~Item 2~2~1]",
		Pritim: "True",
		PageLang: "HEB",
		tmp: 1,
	};

	const queryString = new URLSearchParams(params).toString();

	// API URL
	const apiUrl = `https://pay.hyp.co.il/p/?${queryString}`;

	// Fetch request
	async function createPaymentLink() {
		try {
			const response = await fetch(apiUrl, {
				method: "GET",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			});

			if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

			const data = await response.text(); // Assuming response is text, change to `.json()` if needed
			console.log("Response:", data);
			const link = `https://pay.hyp.co.il/p/?${data}`;
			console.log(link);
			return data;
		} catch (error) {
			console.error("Error:", error.message);
		}
	}

	const paymentLink = await createPaymentLink();

	// STEP 2 - client payment (5326105300985614)

	// STEP 3 - collect data from payment

	// STEP 4 - admin charge

	// STET 5 - create token

	async function createToken(id) {
		try {
			const params = {
				...masofData,
				action: "getToken",
				allowTrueFalse: "True",
				TransId: id, // id from paymnet result (step 3)
			};

			const queryString = new URLSearchParams(params).toString();

			// API URL
			const apiUrl = `https://pay.hyp.co.il/p/?${queryString}`;

			const response = await fetch(apiUrl, {
				method: "GET",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			});

			if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

			const data = await response.text(); // Assuming response is text, change to `.json()` if needed

			return data;
		} catch (error) {
			console.error("Error:", error.message);
		}
	}

	const token = await createToken(261881835);
	console.log("token", token);
	softTransaction("6392578052413445614", "0490496");

	// STep 6 soft transaction

	// Id=261027850&CCode=0&Token=3688405320412205614&Tokef=2512&Fild1=&Fild2=&Fild3=
}

main();

async function softTransaction(token, authnum) {
	try {
		const params = {
			PassP: "hyp1234",
			Masof: "0010302921",
			action: "soft",
			"inputObj.originalUid": "25021509070808822863110",
			"inputObj.originalAmount": "1000",
			"inputObj.authorizationCodeManpik": "7",
			AuthNum: authnum,
			Amount: 9,
			CC: token,
			Tmonth: 12,
			Tyear: 25,
			Coin: 1,
			Info: "test-api14",
			Order: "12345678910",
			Tash: 1,
			UserId: 203269535,
			ClientLName: "Israeli",
			ClientName: "Israel",
			cell: "050555555555",
			phone: "098610338",
			city: "netanya",
			email: "philipbrodovsky@gmail.com",
			street: "levanon 3",
			zip: 42361,
			J5: "False",
			MoreData: "True",
			Postpone: false,
			// Pritim: "True",
			// SendHesh: "True",
			// heshDesc: "[0~Item 1~1~8][0~Item 2~2~1]",
			sendemail: "True",
			UTF8: "True",
			UTF8out: "True",
			Fild1: "freepram",
			Fild2: "freepram",
			Fild3: "freepram",
			Token: "True",
		};

		const queryString = new URLSearchParams(params).toString();
		console.log("queryString", queryString);

		// API URL
		const apiUrl = `https://pay.hyp.co.il/cgi-bin/yaadpay/yaadpay3ds.pl?${queryString}`;
		// const apiUrl = `https://pay.hyp.co.il/p/?${queryString}`;

		const response = await fetch(apiUrl, {
			method: "GET",
		});

		if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

		const data = await response.text(); // Assuming response is text, change to `.json()` if needed
		console.log("\n", data);
		return data;
	} catch (error) {
		console.error("Error:", error.message);
	}
}
