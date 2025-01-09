const params = {
	PassP: "hyp1234",
	KEY: "81057eb786ffc379de89d860031e8fea0e4d28f2",
	Masof: "0010302921",
	action: "APISign",
	What: "SIGN",
	Order: "12345678910", //?
	Info: "test-api", //?
	Amount: 10,
	UTF8: "True",
	UTF8out: "True",
	UserId: "203269535",
	ClientName: "Israel",
	ClientLName: "Isareli",
	street: "levanon+3",
	city: "netanya",
	zip: "42361",
	phone: "098610338",
	cell: "050555555555", //?
	email: "test@yaad.net",
	Tash: "2", //?
	FixTash: "False",
	ShowEngTashText: "False",
	Coin: "1", //?
	Postpone: "False",
	J5: "False",
	MoreData: "True",
	sendemail: "True",
	SendHesh: "True",
	heshDesc: "[0~Item 1~1~8][0~Item 2~2~1]",
	Pritim: "True",
	PageLang: "HEB",
	tmp: "1",
	Sign: "True",
};

function objectToQueryParams(obj) {
	return Object.keys(obj)
		.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
		.join("&");
}

const queryString = objectToQueryParams(params);
console.log("queryString", queryString);

const url = `https://pay.hyp.co.il/p/?${queryString}`;

fetch(url, {
	headers: {},
	mode: "no-cors",
})
	.then(async (res) => {
		console.log("SUCCESS", res.status);
		const body = await res.text();
		console.log(body);

		console.log("link");
		console.log(`https://pay.hyp.co.il/p/?action=pay&${body}`);
	})
	.catch((err) => {
		console.log("fail", err);
	});

// 5326105300985614
// 12/25
// 125
// 890108566

// http://localhost:5173/?Id=250067900&CCode=0&Amount=10&ACode=0357889&Order=12345678910&Fild1=Israel%20Isareli&Fild2=test%40yaad.net&Fild3=&Sign=db5acb1f0c06950ab30ce377f0c66aa4d70ecb257ab19c26954d1592094d38d4&Bank=2&Payments=1&UserId=203269535&Brand=1&Issuer=1&L4digit=5614&street=levanon%203&city=netanya&zip=42361&cell=050555555555&Coin=1&Tmonth=12&Tyear=2025&Info=test-api&errMsg=%D7%AA%D7%A7%D7%99%D7%9F%20(0)&Hesh=0&UID=25010712340908822863354&SpType=0&BinCard=532610
