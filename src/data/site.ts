export const site = {
	name: 'Flood Relief Nepal',
	url: 'https://floodreliefnepal.com',
	github: 'https://github.com/web3Gurung/floodreliefnepal',
	lastChecked: '27 August 2026',
	official: {
		pmdrf: 'https://pmdrf.nchl.com.np/',
		himalayan: 'https://pmrelieffund.himalayanbank.com/',
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
	},
	routes: {
		en: '/',
		ne: '/np/',
	},
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

/** Link targets live here only. Translations override the labels by index. */
export const sources = [
	{
		label: 'Ministry of Foreign Affairs',
		note: 'Official update. Points donors to pmdrf.nchl.com.np.',
		href: site.official.mofa,
	},
	{
		label: 'pmdrf.nchl.com.np',
		note: 'Government card portal for the Prime Minister Disaster Relief Fund.',
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
] as const;

/** Newest first. The footer shows the three most recent entries. */
export const changelog = [
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

export const en = {
	meta: {
		title: 'Flood Relief Nepal, public guide for Bhotekoshi flood relief',
		description:
			'Independent guide for Bhotekoshi flood relief. Where to give, drop supplies, and skip scams.',
	},
	ui: {
		skipToContent: 'Skip to content',
		asOf: 'As of',
		languageLabel: 'Language',
	},
	header: {
		brand: site.name,
		give: 'Give',
		languages: [
			{ label: 'English', href: site.routes.en, lang: 'en' },
			{ label: 'नेपाली', href: site.routes.ne, lang: 'ne' },
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
			'It hit Rasuwa, Nuwakot and neighbouring districts. Published counts of the dead, the missing and the displaced moved a long way inside the first 48 hours, so this page does not carry one.',
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
		lede: "One government portal, works from anywhere in the world, both routes below end in the Prime Minister's Disaster Relief Fund.",
		cards: [
			{
				eyebrow: 'Pay by card',
				title: 'From anywhere in the world',
				body: 'The portal takes Nepali banking apps and wallets, and international Visa and Mastercard. It charges in Nepali rupees, so your own bank handles the conversion.',
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
				body: 'There is no direct crypto route into the fund yet, so the path runs through a card. Load a crypto debit card with USDC or USDT using KAST, Solflare, RedotPay or similar, then pay on the same government portal. Check that the payment lands on pmdrf.nchl.com.np.',
				action: {
					label: 'Open the government portal',
					sub: 'pmdrf.nchl.com.np',
					href: site.official.pmdrf,
				},
				note: 'Government channel. Leaves this site.',
			},
		],
		alternate: {
			text: 'Himalayan Bank runs a second government gateway for the same fund that quotes in USD, useful if you would rather not be charged in rupees or if the main portal is busy.',
			linkLabel: 'pmrelieffund.himalayanbank.com',
			href: site.official.himalayan,
		},
		closing:
			'There is no ceiling on what you can send. Nepal Rastra Bank lifted digital transfer caps into the two Prime Minister funds. Bank transfer details will land here once a verified notice publishes them.',
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
				body: 'The Nepal Police Cyber Bureau has warned about fake QR codes and cloned relief pages going around after the flood. A screenshot of a QR code carries whoever made it.',
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
		],
	},
	share: {
		heading: 'Share this page',
		lede: 'Copy the post below and put it where people are asking how to help. The text stays selectable if the button does not work.',
		post: 'Bhotekoshi flood relief runs through one government door. Card and international payments go to pmdrf.nchl.com.np. There is a gateway that quotes in USD at pmrelieffund.himalayanbank.com. Check the domain before you type a card number. Full guide: floodreliefnepal.com',
		copyLabel: 'Copy the post',
		copiedLabel: 'Copied',
		image: {
			label: 'Open the share image',
			href: '/og.png',
		},
	},
	sources: {
		heading: 'Sources',
		lede: "Government notices and reporting dated 27 August 2026. Names follow the Prime Minister's Office copy in The Rising Nepal.",
		items: sources,
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
		changelog,
	},
} as const;
