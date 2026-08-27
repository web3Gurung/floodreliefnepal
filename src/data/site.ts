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
		kantipur:
			'https://ekantipur.com/news/2026/08/27/178782367918934978.html',
		risingNepal: 'https://risingnepaldaily.com/news/85613',
		ratopatiHubs:
			'https://english.ratopati.com/story/76679/these-three-places-can-be-contacted-to-help-flood-victims',
		republicaPortal:
			'https://myrepublica.nagariknetwork.com/news/govt-launches-new-portal-to-accept-disaster-relief-donations-from-abroad-84-26.html',
		cyberBureau:
			'https://english.onlinekhabar.com/cyber-bureau-warns-public-of-disaster-relief-scams.html',
	},
} as const;

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
		note: 'NDRRMA copy of the same three drop-off points.',
		href: site.official.ratopatiHubs,
	},
	{
		label: 'The Kathmandu Post',
		note: 'One-door policy FAQ, including illegal private collection drives.',
		href: site.official.kathmanduPost,
	},
	{
		label: 'Kantipur',
		note: 'Nepali version of the same one-door briefing.',
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
] as const;
