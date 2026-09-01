/**
 * Every language each page exists in. The switcher and the canonical alternates
 * read the set for the page being rendered, so a reader on the Nepali
 * transparency page reaches the English transparency page rather than the
 * homepage.
 *
 * The guide exists in three languages. The transparency page exists in two, and
 * deliberately offers no Chinese rather than machine translating a page about
 * money into a language nobody on the team reads.
 */
export const routes = {
	home: { en: '/', ne: '/np/', zh: '/zh/' },
	transparency: { en: '/transparency', ne: '/np/transparency' },
} as const;

export const site = {
	name: 'Flood Relief Nepal',
	url: 'https://floodreliefnepal.com',
	github: 'https://github.com/web3Gurung/floodreliefnepal',
	makers: {
		ronak: 'https://x.com/Ronak0010',
		ayushman: 'https://x.com/gurungbuilds',
	},
	lastChecked: '28 August 2026',
	/** ISO form of lastChecked, for structured data. Keep the two in sync. */
	lastCheckedIso: '2026-08-28',
	official: {
		pmdrf: 'https://pmdrf.nchl.com.np/',
		himalayan: 'https://pmrelieffund.himalayanbank.com/',
		embassyIndia: 'https://x.com/EONIndia/status/2093249597858828784',
		mofa: 'https://mofa.gov.np/content/1863/flash-flood-in-bhote-koshi-river/',
		kathmanduPost:
			'https://kathmandupost.com/money/2026/08/27/what-is-the-nepal-government-s-one-door-system-for-flood-relief',
		kantipur: 'https://ekantipur.com/news/2026/08/27/178782367918934978.html',
		risingNepal: 'https://risingnepaldaily.com/news/85613',
		ratopatiHubs:
			'https://english.ratopati.com/story/76679/these-three-places-can-be-contacted-to-help-flood-victims',
		republicaPortal:
			'https://myrepublica.nagariknetwork.com/news/govt-launches-new-portal-to-accept-disaster-relief-donations-from-abroad-84-26.html',
		cyberBureau:
			'https://english.onlinekhabar.com/cyber-bureau-warns-public-of-disaster-relief-scams.html',
		moha: 'https://moha.gov.np/en/post/ha-ra-tha-ka-apa-l-11',
		kathmanduPostExplainer:
			'https://kathmandupost.com/national/2026/08/26/what-we-know-about-the-bhotekoshi-flood-so-far',
		ifrc: 'https://www.ifrc.org/press-release/nepal-ifrc-releases-emergency-funds-flash-floods-leave-communities-isolated',
		raisedReport: 'https://english.onlinekhabar.com/pms-disaster-relief-fund.html',
		alipayPartners: 'https://nchl.com.np/alipay-mobile-payments-partner/',
	},
	routes: routes.home,
} as const;

/** Phone numbers live here only. Translations override the labels by index. */
export const hubs = [
	{
		title: 'Air cargo, Kathmandu',
		place: 'National Emergency Warehouse, Tribhuvan International Airport',
		who: 'Shraddha Bhattarai, WFP',
		phone: '+977 9841879222',
	},
	{
		title: 'Nuwakot',
		place: 'Nepali Army Maithili Barracks, Battar',
		who: 'Avishkar, Nepali Army',
		phone: '+977 9851234324',
	},
	{
		title: 'Dhading',
		place: 'Baireni Barracks',
		who: 'Dilip Ghale',
		phone: '+977 9851154226',
	},
] as const;

/**
 * Copied from the SWIFT table in the Nepal Embassy, India post.
 * Do not add rows that are not on that post.
 */
export const swiftAccounts = [
	{
		bank: 'Rastriya Banijya Bank',
		accounts: ['1130100003762001', '1130100000006006'],
		currency: 'NPR',
		swift: 'RBBANPKA',
	},
	{
		bank: 'Nepal Bank Limited',
		accounts: ['00211600510039000003', '00200100510039000001'],
		currency: 'NPR',
		swift: 'NEBLNPKA',
	},
	{
		bank: 'Agriculture Development Bank Limited',
		accounts: ['0100201002907014'],
		currency: 'NPR',
		swift: 'ADBLNPKA',
	},
	{
		bank: 'Everest Bank Limited',
		accounts: ['00100105200270', '00101102200012'],
		currency: 'NPR',
		swift: 'EVBLNPKA',
	},
	{
		bank: 'Global IME Bank',
		accounts: ['00401010000057', '00411010000005'],
		currency: 'NPR',
		swift: 'GLBBNPKA',
	},
	{
		bank: 'Nabil Bank',
		accounts: ['1710017505285'],
		currency: 'NPR',
		swift: 'NARBNPKA',
	},
	{
		bank: 'Standard Chartered',
		accounts: ['01013243801', '02013243801'],
		currency: 'NPR',
		swift: 'SCBLNPKA',
	},
	{
		bank: 'Himalayan Bank Ltd',
		accounts: ['01905631210046'],
		currency: 'USD',
		swift: 'HIMANPKA',
	},
	{
		bank: 'Himalayan Bank Ltd',
		accounts: ['12005631210039'],
		currency: 'NPR',
		swift: 'HIMANPKA',
	},
	{
		bank: 'Laxmi Sunrise Bank Ltd.',
		accounts: ['1628885410110925'],
		currency: 'NPR',
		swift: 'LXBLNPKA',
	},
] as const;

export const fundAccountName = 'PRIME MINISTER DISASTER RELIEF FUND';

/** Link targets live here only. Translations override the labels by index. */
export const sources = [
	{
		label: 'Ministry of Foreign Affairs',
		note: 'Official update. Points donors to pmdrf.nchl.com.np.',
		href: site.official.mofa,
	},
	{
		label: 'pmdrf.nchl.com.np',
		note: 'Government portal. Card, NepalPAY QR, and Fonepay QR.',
		href: site.official.pmdrf,
	},
	{
		label: 'The Rising Nepal',
		note: 'OPMCM notice. Three collection points and contact numbers.',
		href: site.official.risingNepal,
	},
	{
		label: 'Ratopati',
		note: 'NDRRMA copy of the same three drop off points.',
		href: site.official.ratopatiHubs,
	},
	{
		label: 'The Kathmandu Post',
		note: 'One door policy FAQ, including illegal private collection drives.',
		href: site.official.kathmanduPost,
	},
	{
		label: 'Kantipur',
		note: 'Nepali version of the same one door briefing.',
		href: site.official.kantipur,
	},
	{
		label: 'Republica',
		note: 'Government portal for donors abroad.',
		href: site.official.republicaPortal,
	},
	{
		label: 'OnlineKhabar',
		note: 'Nepal Police Cyber Bureau warning on fake QR codes and fake relief pages.',
		href: site.official.cyberBureau,
	},
	{
		label: 'Ministry of Home Affairs',
		note: 'Official disaster relief appeal. Asks for money into the fund, not goods.',
		href: site.official.moha,
	},
	{
		label: 'The Kathmandu Post explainer',
		note: 'What is known about the Bhotekoshi flood. Follow it for current figures.',
		href: site.official.kathmanduPostExplainer,
	},
	{
		label: 'IFRC press release',
		note: 'Operational source for the shelter, water and first aid items listed under supplies.',
		href: site.official.ifrc,
	},
	{
		label: 'OnlineKhabar on the fund total',
		note: 'Ministry of Finance figure for what the fund took in. The source for the total above.',
		href: site.official.raisedReport,
	},
	{
		label: 'Nepal Embassy, India',
		note: 'Posted the remittance apps and SWIFT accounts for well-wishers in India.',
		href: site.official.embassyIndia,
	},
	{
		label: 'NCHL Alipay+',
		note: 'Official list of Alipay+ apps that can scan NepalPAY QR.',
		href: site.official.alipayPartners,
	},
] as const;

/** Newest first. The footer shows the three most recent entries. */
export const changelog = [
	{
		date: '29 August 2026',
		note: 'Added a Chinese version at /zh/.',
	},
	{
		date: '28 August 2026',
		note: 'Split UPI and Alipay+ into their own sections with official portal screenshots. Added remittance and SWIFT accounts, and a note on turning on international card payments.',
	},
	{
		date: '28 August 2026',
		note: 'Marked the private-collection ban, the crypto wallets, and the Himalayan Bank USD gateway. Official links open in a new tab.',
	},
	{
		date: '28 August 2026',
		note: 'Tightened the page hierarchy so the money path and scam checks read first.',
	},
	{
		date: '28 August 2026',
		note: 'Added the reported fund total, with the date it was reported.',
	},
	{
		date: '28 August 2026',
		note: 'Added FAQ and organisation structured data.',
	},
	{
		date: '28 August 2026',
		note: 'Added what responders are handing out, framed as not a government list.',
	},
	{
		date: '28 August 2026',
		note: 'Added the Nepali version and the share block.',
	},
	{
		date: '28 August 2026',
		note: 'Added the situation summary and this changelog.',
	},
	{
		date: '28 August 2026',
		note: 'Rewrote the money section and added the scam checks.',
	},
] as const;

type RaisedFigure = {
	amount: string;
	/** Conversion of `amount`. Recalculate from the NRB USD buying rate on `asOf`. */
	amountUsd: string;
	asOf: string;
	note: string;
	source: string;
};

/**
 * Manually updated. There is no government API or public ledger for this fund.
 * Update the amount whenever a newer figure is reported. Set this to null,
 * rather than leave a figure older than a week on the page. The page renders
 * nothing when it is null, and never renders the amount without its asOf date.
 *
 * amountUsd is Rs 273.3 million at the Nepal Rastra Bank USD buying rate of
 * Rs 152.37 on 27 August 2026, rounded to $1.79 million.
 */
export const raised: RaisedFigure | null = {
	amount: 'Rs 273.3 million',
	amountUsd: '$1.79 million',
	asOf: '27 August 2026',
	note: 'first six hours, per the Ministry of Finance',
	source: site.official.raisedReport,
};

/**
 * Not a government list. The Home Ministry appeal asks for money, not goods.
 * These are the goods responders are distributing and the collection points
 * report needing. Translations override the labels by index.
 */
export const needs = [
	{ group: 'Shelter', items: ['Tents', 'Tarpaulins', 'Blankets', 'Sleeping mats'] },
	{ group: 'Food and water', items: ['Drinking water', 'Dry food items'] },
	{ group: 'Health', items: ['First aid kits', 'Medicines'] },
	{ group: 'Hygiene', items: ['Sanitary pads', 'Toothpaste and hygiene essentials'] },
	{ group: 'Clothing', items: ['Clothes', 'Essential items for children'] },
	{ group: 'Power', items: ['Power banks and chargers'] },
] as const;

/**
 * The onchain collection address for the Nepal Relief drive. Engage Nepal, a US
 * 501(c)(3), holds it and passes what arrives to the Prime Minister Disaster
 * Relief Fund. Figures for this address come from `ledger.json`, which the
 * indexer writes. Nothing here is hand entered.
 */
export const receiving = {
	address: '0xA891BB5abf91aBf1796074a1303E75754AF1823D',
	chain: 'Ethereum mainnet',
	explorer: 'https://etherscan.io',
} as const;

export const en = {
	meta: {
		title: 'Flood Relief Nepal, public guide for Bhotekoshi flood relief',
		description:
			'Independent guide for Bhotekoshi flood relief. Where to send money by UPI, Alipay+, card, or SWIFT, where to drop supplies, and how to skip fake QR codes.',
	},
	ui: {
		skipToContent: 'Skip to content',
		opensInNewTab: 'opens in a new tab',
		asOf: 'As of',
		sentenceEnd: '.',
		languageLabel: 'Language',
	},
	header: {
		brand: site.name,
		give: 'Donate',
		languages: [
			{ label: 'English', href: site.routes.en, lang: 'en' },
			{ label: 'नेपाली', href: site.routes.ne, lang: 'ne' },
			{ label: '中文', href: site.routes.zh, lang: 'zh' },
		],
	},
	hero: {
		eyebrow: 'Independent public guide',
		title: site.name,
		lede: 'Where to give, where to drop supplies, and how to skip fake QR codes. Not a government site.',
		primary: { label: 'See how to help', href: '#give' },
		links: [
			{ label: 'One door system', href: '#policy' },
			{ label: 'Spot a fake page', href: '#verify' },
		],
		photoAlt: 'Snow peaks and a hillside stupa in the Nepal Himalaya',
		photoCaption: 'Nepal Himalaya',
	},
	situation: {
		heading: 'What happened',
		asOf: '27 August 2026',
		body: [
			'A flash flood came down the Bhote Koshi river on the morning of 26 August 2026. It started on the Tibet side of the border and crossed into Nepal.',
			'It hit Rasuwa, Nuwakot and neighbouring districts.',
		],
		link: {
			label: 'The Kathmandu Post, what we know about the Bhotekoshi flood so far',
			href: site.official.kathmanduPostExplainer,
		},
	},
	policy: {
		heading: 'The government opened one door',
		lede: "Cash and supplies for Bhotekoshi relief are supposed to go through the Prime Minister's Disaster Relief Fund. Not through random drives on Facebook.",
		body: [
			"The Ministry of Finance says the rule covers people, companies, donor agencies, and foreign organisations. The Prime Minister's Office named the drop off points. The army, police, civil offices, and local governments then move the aid out so it does not sit in one pile while another village gets nothing.",
			'Private groups are not allowed to collect money or goods on their own. Finance officials called those social media campaigns illegal. The Home Ministry has orders to shut them down.',
		],
	},
	give: {
		heading: 'Send money',
		raised,
		raisedReportLabel: 'Read the report',
		lede: 'Choose how you pay. UPI if you are in India, Alipay or an app that supports Alipay+, a card from anywhere, or a bank transfer.',
		tabsLabel: 'How to pay',
		tabs: [
			{ id: 'upi', label: 'UPI', detail: 'If you are in India' },
			{ id: 'alipay', label: 'Alipay+', detail: 'Scan a NepalPAY code' },
			{ id: 'card', label: 'Card', detail: 'Visa, Mastercard, or a Nepali app' },
			{ id: 'remit', label: 'Wise, Remitly', detail: 'SWIFT or a bank transfer' },
		],
		cards: [
			{
				eyebrow: 'Pay by card',
				title: 'From anywhere in the world',
				body: 'The portal takes international Visa and Mastercard, and Nepali banking apps. It charges in Nepali rupees, so your own bank handles the conversion. If a card from another country is declined, turn on international or overseas transactions in your banking app, then try again.',
				action: {
					label: 'Open the government portal',
					sub: 'pmdrf.nchl.com.np',
					href: site.official.pmdrf,
				},
				note: 'Government channel. Leaves this site.',
			},
			{
				eyebrow: 'Pay with stablecoins',
				title: 'If you hold crypto',
				body: 'There is no direct crypto route into the fund yet, so the path runs through a card. Load a crypto debit card with USDC or USDT using KAST, Solflare, RedotPay or similar, then pay on the same government portal.',
				action: {
					label: 'Open the government portal',
					sub: 'pmdrf.nchl.com.np',
					href: site.official.pmdrf,
				},
				note: 'Government channel. Leaves this site.',
			},
		],
		routes: [
			{
				id: 'upi',
				shot: 'fonepay',
				eyebrow: 'If you are in India',
				heading: 'Scan with UPI',
				body: 'Open GPay, PhonePe, Paytm, or any other UPI app and scan the Fonepay code. You can also open the government portal and pick Fonepay QR. Do not pay a QR that arrived in a chat.',
				caption: 'Fonepay QR on pmdrf.nchl.com.np',
				alt: 'Official Fonepay QR on the government portal, for UPI in India',
				action: {
					label: 'Open the government portal',
					sub: 'pmdrf.nchl.com.np',
					href: site.official.pmdrf,
				},
				note: 'If the screenshot will not scan, open the live page and pick Fonepay QR.',
			},
			{
				id: 'alipay',
				shot: 'nepalpay',
				eyebrow: 'If you use Alipay+',
				heading: 'Scan with Alipay+',
				body: 'Open Alipay or an app that supports Alipay+ and scan the NepalPAY code. You can also open the government portal and pick NepalPAY QR. Do not pay a QR that arrived in a chat.',
				caption: 'NepalPAY QR on pmdrf.nchl.com.np',
				alt: 'Official NepalPAY QR on the government portal, for Alipay+',
				action: {
					label: 'Open the government portal',
					sub: 'pmdrf.nchl.com.np',
					href: site.official.pmdrf,
				},
				note: 'If the screenshot will not scan, open the live page and pick NepalPAY QR.',
			},
		],
		alternate: {
			text: 'Himalayan Bank runs a second government gateway for the same fund that quotes in USD, useful if you would rather not be charged in rupees or if the main portal is busy.',
			linkLabel: 'pmrelieffund.himalayanbank.com',
			href: site.official.himalayan,
		},
		remit: {
			heading: 'Wise, Remitly, and SWIFT',
			lede: 'GME, Remitly, Wise, TapTapSend, and other remittance apps can send to the NPR accounts below. SWIFT works worldwide from a bank or internet banking.',
			accountNameLabel: 'Account name for every row',
			accountName: fundAccountName,
			columns: {
				bank: 'Bank',
				account: 'Account number',
				currency: 'Currency',
				swift: 'SWIFT',
			},
			rows: swiftAccounts,
			sourceBefore: 'Source: ',
			sourceLabel: 'Nepal Embassy, India post',
			sourceHref: site.official.embassyIndia,
		},
		closing:
			'There is no ceiling on what you can send. Nepal Rastra Bank lifted digital transfer caps into the two Prime Minister funds.',
	},
	verify: {
		heading: 'Check before you send',
		lede: 'Four checks that take ten seconds.',
		checks: [
			{
				title: 'Read the address bar',
				body: 'For this fund the payment pages live on pmdrf.nchl.com.np and pmrelieffund.himalayanbank.com. Type a card number only when one of those two is in the address bar.',
			},
			{
				title: 'A QR image in a chat is a stranger, not a fund',
				body: 'The UPI and Alipay+ images on this page are screenshots of pmdrf.nchl.com.np. A QR that arrived in a chat is still a stranger. The Nepal Police Cyber Bureau has warned about fake QR codes and cloned relief pages after the flood.',
			},
			{
				title: 'Personal accounts are the tell',
				body: 'The fund receives on government channels. A request to send to a personal bank account, a personal wallet or a crypto address belongs to a person, and private collection for this disaster is not authorised.',
			},
			{
				title: 'Slow down in the first 72 hours',
				body: 'That window is when fake pages spread fastest. Check the domain against this page or the government notices in Sources before you send.',
			},
		],
		link: {
			label: 'Nepal Police Cyber Bureau warning on relief scams',
			href: site.official.cyberBureau,
		},
	},
	supplies: {
		heading: 'Send supplies',
		lede: 'Hand goods to the government, or work with the Chief District Officer in the district you mean to help.',
		needs: {
			heading: 'What responders are handing out',
			note: 'The government has published no list of goods, and the Home Ministry appeal asks for money into the fund rather than things. The list below is what responders are distributing on the ground and what the collection points report needing.',
			groups: needs,
			callFirst:
				'Call the contact for your nearest point before you load a vehicle, since they know what they are short of today.',
		},
		hubs,
	},
	faq: {
		heading: 'Questions',
		items: [
			{
				q: 'Is this an official government website?',
				a: 'No. This is an independent guide. The government sites and drop off points are listed here so you do not have to hunt them down.',
			},
			{
				q: 'Can I run my own collection drive?',
				a: 'No. The government has not authorised private groups or people to collect cash or goods for this disaster. Posts asking you to send money to a personal wallet are illegal.',
			},
			{
				q: 'Do I have to give cash?',
				a: 'No. You can drop supplies at the airport warehouse or the army barracks listed above. You can also talk to the Chief District Officer of the affected district.',
			},
			{
				q: 'Is there a limit on how much I can send?',
				a: 'No. The Finance Ministry said there is no ceiling on cash or goods. Nepal Rastra Bank also lifted digital transfer caps into the two Prime Minister funds.',
			},
			{
				q: 'Who hands the aid to people on the ground?',
				a: 'Civil administration, the Nepali Army, Nepal Police, and local and provincial governments. The point of the one door rule is that one desk tracks what came in, so a village is less likely to be skipped.',
			},
			{
				q: 'Can I pay with UPI from India?',
				a: 'Yes. Open your UPI app and scan the Fonepay code in the money section, or open pmdrf.nchl.com.np and pick Fonepay QR.',
			},
			{
				q: 'Can I pay with Alipay or an app that supports Alipay+?',
				a: 'Yes. Open Alipay or an app that supports Alipay+ and scan the NepalPAY code in the money section, or open pmdrf.nchl.com.np and pick NepalPAY QR.',
			},
			{
				id: 'alipay-apps',
				q: 'Which Alipay+ apps can scan the NepalPAY code?',
				a: 'NCHL lists these apps for NepalPAY QR.\nChinese mainland: Alipay.\nHong Kong SAR: AlipayHK.\nMacao SAR: MPay.\nMalaysia: Touch \'n Go eWallet, MyPB by Public Bank Berhad.\nSingapore: Changi Pay, OCBC Digital, BigPay, Starryblu.\nSouth Korea: KakaoPay, Naver Pay, Toss Pay.\nPhilippines: GCash.\nThailand: TrueMoney.\nMongolia: Hipay.\nItaly: Tinaba.\nGermany: Bluecode.\nBigPay also works in Malaysia and Thailand.\nOther Alipay+ apps are not on this list.',
			},
			{
				q: 'Can I use Wise, Remitly, or a bank SWIFT transfer?',
				a: 'Yes. The Nepal Embassy in India posted GME, Remitly, Wise, TapTapSend, and SWIFT accounts named Prime Minister Disaster Relief Fund. Copy the numbers from this page or from that post, not from a chat.',
			},
		],
	},
	notFound: {
		title: 'Page not found, Flood Relief Nepal public guide',
		description: 'That page does not exist. Go back to the Flood Relief Nepal public guide.',
		heading: 'That page is not here.',
		before: 'Start on the ',
		linkLabel: 'homepage',
		after: ' for the public guide.',
	},
	share: {
		heading: 'Share this page',
		lede: 'Copy the post below and put it where people are asking how to help. The text stays selectable if the button does not work.',
		post: 'Bhotekoshi flood relief runs through one government door. Cards go to pmdrf.nchl.com.np. If you are in India, scan the Fonepay UPI code on floodreliefnepal.com. Open Alipay or an app that supports Alipay+ and scan the NepalPAY code there. Ignore a QR that arrived in a chat.',
		copyLabel: 'Copy the post',
		copiedLabel: 'Copied',
		image: {
			label: 'Open the share image',
			href: '/og.png',
		},
	},
	sources: {
		heading: 'Sources',
		lede: "Government notices and reporting dated 27 and 28 August 2026. Names follow the Prime Minister's Office copy in The Rising Nepal.",
		items: sources,
	},
	transparency: {
		meta: {
			title: 'Transparency, every donation to Nepal Relief',
			description:
				'Every crypto donation that reached the Nepal Relief address, the running total in US dollars, and a link to check each one on Etherscan.',
		},
		chainName: 'Ethereum mainnet',
		eyebrow: 'Nepal Relief',
		heading: 'Every donation that has arrived',
		lede: 'Engage Nepal, a US 501(c)(3), collects these donations onchain and passes them to the Prime Minister Disaster Relief Fund. This page reads the receiving address directly, so you can check every figure on it against the public record.',
		total: {
			label: 'Received so far',
			basis: 'Each figure uses the price of the asset at the moment that donation arrived.',
			donationsOne: 'donation',
			donationsMany: 'donations',
			updated: 'This page last read the chain on {when}.',
			updatedAgo: 'This page last read the chain {ago}.',
			ago: {
				template: '{value} {unit} ago',
				lessThanAMinute: 'less than a minute ago',
				minute: 'minute',
				minutes: 'minutes',
				hour: 'hour',
				hours: 'hours',
				day: 'day',
				days: 'days',
			},
			feedBehind:
				'The live feed reports {count} and {total}. The figures on this page were read on {when}.',
			feedStale:
				'The live feed last read the chain {ago}. The figures on this page were read on {when}.',
			feedDown: 'The live feed is not answering. The figures on this page were read on {when}.',
		},
		excluded: {
			covers: 'The total covers {covered} of {total}.',
			unpriced: 'Of those, {count} arrived in an asset whose price no source publishes.',
			lowConfidence:
				'Of those, {count} arrived in an asset whose published price looked unreliable.',
			tableNote: 'The table lists the amount that arrived.',
		},
		table: {
			heading: 'Donations',
			note: 'Showing the {shown} most recent of {total}.',
			timesNote: 'Times are UTC.',
			columns: {
				time: 'Arrived',
				asset: 'Asset',
				amount: 'Amount',
				usd: 'US dollars',
				check: 'Check',
			},
			noPrice: 'Price unpublished',
			checkLabel: 'Etherscan',
			checkAria: 'Open transaction {hash} on Etherscan',
		},
		merge: {
			heading: 'Where it came from and where it sits',
			lede: 'Each ribbon is one asset people sent. Its width is that asset\u2019s share of the total, so the picture reads the same way the number does.',
			poolLabel: 'Held at this address',
			reservedLabel: 'Sent to the fund',
			reservedNote: 'This space fills when the first transfer to the fund goes out.',
			legendHeading: 'What each ribbon is',
			legendShare: '{percent} of the total',
			legendCount: '{count}',
			unknownShare: 'share unknown, this asset has no published price',
			dotLabel: '{amount} {token}, {date}. Open the transaction on Etherscan',
			figureLabel:
				'A diagram of donations by asset flowing into the collection address, with the space for the onward transfer still empty.',
			motionNote: 'The most recent donations move into the pool once when the page loads.',
		},
		pipeline: {
			heading: 'What happens to your money',
			lede: 'Six steps from your wallet to the fund. Each one says what happens and what proof exists.',
			whatLabel: 'What happens',
			proofLabel: 'What proof exists',
			openLabel: 'Anyone can check this now',
			documentLabel: 'You see this when we publish it',
			notLiveLabel: 'Not live yet',
			steps: [
				{
					title: 'Your wallet',
					what: 'You send USDC, ETH or another asset from a wallet you control.',
					proof: 'Your wallet signs the transaction and the blockchain records it. It is in your own transaction history.',
					open: true,
					live: true,
				},
				{
					title: 'The swap',
					what: 'If you paid in another asset or on another chain, a swap converts it and forwards the result.',
					proof: 'The swap writes both sides on chain, and the arrival carries a transaction hash you can look up.',
					open: true,
					live: true,
				},
				{
					title: 'The collection address',
					what: 'The asset lands at the address Engage Nepal controls, and this page lists it within a minute.',
					proof: 'Etherscan shows every arrival. The table on this page shows the same rows, at the same address.',
					open: true,
					live: true,
				},
				{
					title: 'The exchange',
					what: 'Engage Nepal converts the balance to United States dollars through a regulated exchange.',
					proof: 'The exchange issues a statement to Engage Nepal. You see the amount when Engage Nepal publishes that statement.',
					open: false,
					live: false,
				},
				{
					title: 'The bank transfer',
					what: 'Engage Nepal wires those dollars to the account of the Prime Minister Disaster Relief Fund.',
					proof: 'The wire receipt names the amount, the date and the recipient. You see it when Engage Nepal publishes it.',
					open: false,
					live: false,
				},
				{
					title: 'The fund',
					what: 'The Prime Minister Disaster Relief Fund receives the money and spends it on relief.',
					proof: 'The fund reports its own totals. That accounting belongs to the government of Nepal.',
					open: false,
					live: false,
				},
			],
			closing:
				'The first three steps sit on a public blockchain. Anyone can check them right now, from any computer, without asking us for permission. The last three happen inside banks. You can see them only once we publish the paperwork, and you are trusting us to publish all of it. This page shows you where the public record stops and where trust begins.',
		},
		mosaic: {
			heading: 'Every donation as a tile',
			lede: 'One tile for each donation, oldest first. Tile size follows the amount, and the smallest carry a minimum size so they stay easy to tap.',
			tileLabel: '{amount} {token}, {date}. Open the transaction on Etherscan',
			unpricedNote: 'A tile in grey arrived in an asset with no published price.',
		},
		media: {
			heading: 'Watched from outside',
			lede: 'Posts and news about this drive from people who do not run it. Each quote stays in the language it was written in, and each one links to the original.',
			placeholderNotice:
				'Some entries below are placeholders. Real posts and headlines replace them before this page goes live.',
			postLabel: 'Post on X',
			articleLabel: 'News article',
			openPost: 'Open the post on X',
			openArticle: 'Read the article',
		},
		steward: [
			'Engage Nepal holds this address, a charitable organisation registered in the United States under section 501(c)(3).',
			'It passes what arrives here to the Prime Minister Disaster Relief Fund.',
			'A registered organisation answers for that money under United States charity law, and this page publishes every donation it receives.',
		],
		verify: {
			heading: 'Check this yourself',
			lede: 'Every number above comes from the public record. Here is how to read that record directly.',
			addressLabel: 'Receiving address, {chain}',
			addressLink: 'Open the address on Etherscan',
			steps: [
				'Open the address on Etherscan and read the token transfers tab. Every donation in the table above appears there, with the same hash and the same amount.',
				'Add the amounts. This page values each donation at the price of its asset at the moment it arrived, so the dollar column can differ from what the same amount is worth today.',
				'Read the timestamp under the total. It says when this page last read the chain.',
			],
		},
		empty: {
			heading: 'The address is live and waiting',
			body: 'This address is ready to receive. Every donation will appear here as it lands, with a link to check it on Etherscan.',
		},
	},
	footer: {
		lastChecked: 'Last checked',
		lastCheckedDate: site.lastChecked,
		independent: 'Independent guide. Not a government website.',
		contribute: {
			before: '',
			linkLabel: 'GitHub',
			after: ' if you want to send a pull request.',
		},
		madeBy: {
			before: 'Made by ',
			ronakLabel: 'Ronak',
			middle: ' and ',
			ayushmanLabel: 'Ayushman',
			after: '',
		},
		changelog,
	},
} as const;
