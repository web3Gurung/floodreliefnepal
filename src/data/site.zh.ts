import { site, hubs, sources, raised, swiftAccounts, fundAccountName } from './site';

/**
 * Simplified Chinese copy. Same shape as `en` in site.ts.
 * Phone numbers come from `hubs` and link targets from `sources`, so only the
 * labels are repeated here.
 */
export const zh = {
	meta: {
		title: '尼泊尔洪灾救援，波达科西洪灾救援公共指南',
		description:
			'波达科西洪灾救援独立指南。说明如何通过 UPI、Alipay+、银行卡或 SWIFT 汇款，往哪里送物资，以及如何避开假二维码。',
	},
	ui: {
		skipToContent: '跳到正文',
		asOf: '截至',
		sentenceEnd: '。',
		languageLabel: '语言',
	},
	header: {
		brand: '尼泊尔洪灾救援',
		give: '捐款',
		languages: [
			{ label: 'English', href: site.routes.en, lang: 'en' },
			{ label: 'नेपाली', href: site.routes.ne, lang: 'ne' },
			{ label: '中文', href: site.routes.zh, lang: 'zh' },
		],
	},
	hero: {
		eyebrow: '独立公共指南',
		title: '尼泊尔洪灾救援',
		lede: '往哪里捐款，往哪里送物资，以及如何避开假二维码。本站不是政府网站。',
		primary: { label: '查看如何援助', href: '#give' },
		links: [
			{ label: '一站式通道', href: '#policy' },
			{ label: '识别假页面', href: '#verify' },
		],
		photoAlt: '尼泊尔喜马拉雅的雪峰和山坡佛塔',
		photoCaption: '尼泊尔喜马拉雅',
	},
	situation: {
		heading: '发生了什么',
		asOf: '2026年8月27日',
		body: [
			'2026年8月26日清晨，波达科西河突发山洪。洪水从边境西藏一侧起，流入尼泊尔。',
			'它影响了拉苏瓦、努瓦科特及邻近县。',
		],
		link: {
			label: '加德满都邮报，波达科西洪灾目前已知情况',
			href: site.official.kathmanduPostExplainer,
		},
	},
	policy: {
		heading: '政府只开了一道门',
		lede: '波达科西救援的现金和物资应通过总理灾害救济基金。不要走 Facebook 上的随意募捐。',
		body: [
			'财政部称，该规定适用于个人、公司、捐助机构和外国组织。卸货点由总理办公室指定。随后由军队、警察、民政部门和地方政府分发，避免物资堆在一处，而另一个村子什么都没有。',
			'私人团体不得自行募集资金或物资。财政部官员称这类社交媒体募捐为非法。内政部已下令予以制止。',
		],
	},
	give: {
		heading: '汇款',
		raised: raised && {
			...raised,
			amount: '2.733亿尼泊尔卢比',
			amountUsd: '179万美元',
			asOf: '2026年8月27日',
			note: '最初六小时，据财政部',
		},
		raisedReportLabel: '阅读报道',
		lede: '选择付款方式。在印度用 UPI，在中国用支付宝或 Alipay+，世界各地可用银行卡，也可银行转账。',
		tabsLabel: '如何付款',
		tabs: [
			{ id: 'upi', label: 'UPI', detail: '若你在印度' },
			{ id: 'alipay', label: '支付宝/ Alipay+', detail: '若你在中国' },
			{ id: 'card', label: '银行卡', detail: 'Visa、Mastercard 或尼泊尔应用' },
			{ id: 'remit', label: 'Wise, Remitly', detail: 'SWIFT 或银行转账' },
		],
		cards: [
			{
				eyebrow: '刷卡支付',
				title: '世界各地均可',
				body: '该门户接受国际 Visa 和 Mastercard，以及尼泊尔银行应用。扣款以尼泊尔卢比计，汇率由你自己的银行处理。若外国卡被拒，请在银行应用中开启国际或境外交易后再试。',
				action: {
					label: '打开政府门户',
					sub: 'pmdrf.nchl.com.np',
					href: site.official.pmdrf,
				},
				note: '政府渠道。将离开本站。',
			},
			{
				eyebrow: '用稳定币支付',
				title: '若你持有加密货币',
				body: '基金尚无直接加密通道，因此需经银行卡。用 KAST、Solflare、RedotPay 或类似服务，将 USDC 或 USDT 充入加密借记卡，再在同一政府门户付款。',
				action: {
					label: '打开政府门户',
					sub: 'pmdrf.nchl.com.np',
					href: site.official.pmdrf,
				},
				note: '政府渠道。将离开本站。',
			},
		],
		routes: [
			{
				id: 'upi',
				shot: 'fonepay',
				eyebrow: '若你在印度',
				heading: '用 UPI 扫描',
				body: '打开 GPay、PhonePe、Paytm 或其他 UPI 应用，扫描 Fonepay 码。也可打开政府门户，选择 Fonepay QR。不要向聊天里发来的二维码付款。',
				caption: 'pmdrf.nchl.com.np 上的 Fonepay QR',
				alt: '政府门户上的官方 Fonepay QR，供印度 UPI 使用',
				action: {
					label: '打开政府门户',
					sub: 'pmdrf.nchl.com.np',
					href: site.official.pmdrf,
				},
				note: '若截图无法扫描，请打开实时页面并选择 Fonepay QR。',
			},
			{
				id: 'alipay',
				shot: 'nepalpay',
				eyebrow: '若你在中国',
				heading: '扫描 NepalPAY 码',
				body: '打开支付宝或 Alipay+，扫描 NepalPAY 码。也可打开政府门户，选择 NepalPAY QR。不要向聊天里发来的二维码付款。',
				caption: 'pmdrf.nchl.com.np 上的 NepalPAY QR',
				alt: '政府门户上的官方 NepalPAY QR，供支付宝和 Alipay+ 使用',
				action: {
					label: '打开政府门户',
					sub: 'pmdrf.nchl.com.np',
					href: site.official.pmdrf,
				},
				note: '若截图无法扫描，请打开实时页面并选择 NepalPAY QR。',
			},
		],
		alternate: {
			text: '喜马拉雅银行为同一基金运营另一政府通道，以美元计价。若不想按卢比扣款，或主门户繁忙，可用此通道。',
			linkLabel: 'pmrelieffund.himalayanbank.com',
			href: site.official.himalayan,
		},
		remit: {
			heading: 'Wise、Remitly 和 SWIFT',
			lede: 'GME、Remitly、Wise、TapTapSend 及其他汇款应用可汇入下列尼泊尔卢比账户。SWIFT 可从世界各地的银行或网银办理。',
			accountNameLabel: '每一行的账户名',
			accountName: fundAccountName,
			columns: {
				bank: '银行',
				account: '账号',
				currency: '币种',
				swift: 'SWIFT',
			},
			rows: [
				{ ...swiftAccounts[0], bank: '国家商业银行' },
				{ ...swiftAccounts[1], bank: '尼泊尔银行' },
				{ ...swiftAccounts[2], bank: '农业发展银行' },
				{ ...swiftAccounts[3], bank: '珠穆朗玛银行' },
				{ ...swiftAccounts[4], bank: 'Global IME 银行' },
				{ ...swiftAccounts[5], bank: 'Nabil 银行' },
				{ ...swiftAccounts[6], bank: '渣打银行' },
				{ ...swiftAccounts[7], bank: '喜马拉雅银行' },
				{ ...swiftAccounts[8], bank: '喜马拉雅银行' },
				{ ...swiftAccounts[9], bank: '拉克西米日出银行' },
			],
			sourceBefore: '来源：',
			sourceLabel: '尼泊尔驻印度大使馆帖文',
			sourceHref: site.official.embassyIndia,
		},
		closing:
			'汇款没有上限。尼泊尔国家银行已取消向两个总理基金进行数字转账的额度限制。',
	},
	verify: {
		heading: '汇出前请核对',
		lede: '四项检查，大约十秒。',
		checks: [
			{
				title: '看地址栏',
				body: '该基金的付款页只在 pmdrf.nchl.com.np 和 pmrelieffund.himalayanbank.com。只有地址栏出现这两处之一时，才输入卡号。',
			},
			{
				title: '聊天里的二维码图片是陌生人，不是基金',
				body: '本页的 UPI 和 Alipay+ 图是 pmdrf.nchl.com.np 的截图。聊天里发来的二维码仍是陌生人。尼泊尔警察网络局已警告，洪灾后出现假二维码和仿冒救援页。',
			},
			{
				title: '私人账户就是信号',
				body: '基金只走政府渠道。让你打到私人银行账户、私人钱包或加密地址的，属于个人。此次灾害的私人募捐未经授权。',
			},
			{
				title: '头 72 小时放慢',
				body: '假页面在这段时间传播最快。汇出前，请对照本页或来源中的政府公告核对域名。',
			},
		],
		link: {
			label: '尼泊尔警察网络局关于救援诈骗的警告',
			href: site.official.cyberBureau,
		},
	},
	supplies: {
		heading: '运送物资',
		lede: '把物资交给政府，或与你打算援助的县的首席地区官协调。',
		needs: {
			heading: '救援人员正在发放什么',
			note: '政府未公布物资清单，内政部的呼吁是向基金捐款，而不是捐物品。下列清单是救援人员在现场发放的，以及收集点报告短缺的物品。',
			groups: [
				{ group: '住所', items: ['帐篷', '篷布', '毯子', '睡垫'] },
				{ group: '食品和饮水', items: ['饮用水', '干粮'] },
				{ group: '医疗', items: ['急救包', '药品'] },
				{ group: '卫生', items: ['卫生巾', '牙膏及其他卫生用品'] },
				{ group: '衣物', items: ['衣服', '儿童必需品'] },
				{ group: '电力', items: ['充电宝和充电器'] },
			],
			callFirst:
				'装车前先给最近收集点的联系人打电话，他们知道今天缺什么。',
		},
		hubs: [
			{
				title: '航空货运，加德满都',
				place: '国家应急仓库，特里布万国际机场',
				who: '施拉达·巴塔拉伊，WFP',
				phone: hubs[0].phone,
			},
			{
				title: '努瓦科特',
				place: '尼泊尔军队迈蒂利军营，巴塔尔',
				who: '阿维什卡尔，尼泊尔军队',
				phone: hubs[1].phone,
			},
			{
				title: '达丁',
				place: '拜雷尼军营',
				who: '迪利普·加勒',
				phone: hubs[2].phone,
			},
		],
	},
	faq: {
		heading: '常见问题',
		items: [
			{
				q: '这是官方政府网站吗？',
				a: '不是。这是独立指南。政府网站和卸货点列在这里，免得你自己去找。',
			},
			{
				q: '我可以自己组织募捐吗？',
				a: '不可以。政府未授权私人团体或个人为此次灾害募集现金或物资。让你打到私人钱包的帖文是非法的。',
			},
			{
				q: '必须捐现金吗？',
				a: '不必。可以把物资送到上面列出的机场仓库或军营。也可以和受灾县的首席地区官联系。',
			},
			{
				q: '汇款有上限吗？',
				a: '没有。财政部称现金和物资都没有上限。尼泊尔国家银行也取消了向两个总理基金进行数字转账的额度限制。',
			},
			{
				q: '谁把援助交到现场的人手里？',
				a: '民政部门、尼泊尔军队、尼泊尔警察，以及地方和省政府。一站式规则的目的，是由一张桌子记录收到了什么，减少某个村子被漏掉。',
			},
			{
				q: '能从印度用 UPI 付款吗？',
				a: '可以。打开 UPI 应用，扫描汇款区的 Fonepay 码，或打开 pmdrf.nchl.com.np 并选择 Fonepay QR。',
			},
			{
				q: '能用支付宝或 Alipay+ 付款吗？',
				a: '可以。打开支付宝或 Alipay+，扫描汇款区的 NepalPAY 码，或打开 pmdrf.nchl.com.np 并选择 NepalPAY QR。',
			},
			{
				q: '能用 Wise、Remitly 或银行 SWIFT 汇款吗？',
				a: '可以。尼泊尔驻印度大使馆公布了 GME、Remitly、Wise、TapTapSend，以及账户名为 Prime Minister Disaster Relief Fund 的 SWIFT 账户。请从本页或该帖复制号码，不要从聊天里复制。',
			},
		],
	},
	notFound: {
		title: '找不到页面，尼泊尔洪灾救援公共指南',
		description: '没有这个页面。请回到尼泊尔洪灾救援公共指南。',
		heading: '这里没有这个页面。',
		before: '请从',
		linkLabel: '首页',
		after: '开始查看公共指南。',
	},
	share: {
		heading: '分享本页',
		lede: '复制下面的帖文，发到人们在问如何援助的地方。若按钮无效，文字仍可选取。',
		post: '波达科西洪灾救援走政府的单一通道。银行卡捐给 pmdrf.nchl.com.np。在印度请扫描 floodreliefnepal.com 上的 Fonepay UPI 码。在中国请用支付宝或 Alipay+ 扫描那里的 NepalPAY 码。聊天里发来的二维码请忽略。',
		copyLabel: '复制帖文',
		copiedLabel: '已复制',
		image: {
			label: '打开分享图',
			href: '/og.png',
		},
	},
	sources: {
		heading: '来源',
		lede: '截至 2026年8月27日和28日的政府公告与报道。名称依据崛起尼泊尔所载总理办公室文本。',
		items: [
			{
				label: '外交部',
				note: '官方更新。引导捐款人前往 pmdrf.nchl.com.np。',
				href: sources[0].href,
			},
			{
				label: 'pmdrf.nchl.com.np',
				note: '政府门户。银行卡、NepalPAY QR 和 Fonepay QR。',
				href: sources[1].href,
			},
			{
				label: '崛起尼泊尔',
				note: '总理办公室公告。三个收集点和联系电话。',
				href: sources[2].href,
			},
			{
				label: '拉托帕蒂',
				note: '国家减灾管理局对同一三个卸货点的说明。',
				href: sources[3].href,
			},
			{
				label: '加德满都邮报',
				note: '一站式政策问答，包括非法私人募捐。',
				href: sources[4].href,
			},
			{
				label: '坎蒂普尔',
				note: '同一份一站式简报的尼泊尔语版本。',
				href: sources[5].href,
			},
			{
				label: '共和国报',
				note: '面向境外捐款人的政府门户。',
				href: sources[6].href,
			},
			{
				label: '在线新闻',
				note: '尼泊尔警察网络局关于假二维码和假救援页的警告。',
				href: sources[7].href,
			},
			{
				label: '内政部',
				note: '官方灾害救援呼吁。要求向基金捐款，而不是捐物品。',
				href: sources[8].href,
			},
			{
				label: '加德满都邮报解释稿',
				note: '波达科西洪灾目前已知情况。最新数字请看这篇。',
				href: sources[9].href,
			},
			{
				label: 'IFRC 新闻稿',
				note: '物资一节所列住所、饮水和急救用品的作业来源。',
				href: sources[10].href,
			},
			{
				label: '在线新闻关于基金总额',
				note: '财政部公布的基金收入。上面总额的来源。',
				href: sources[11].href,
			},
			{
				label: '尼泊尔驻印度大使馆',
				note: '为在印度的善心人士公布了汇款应用和 SWIFT 账户。',
				href: sources[12].href,
			},
		],
	},
	footer: {
		lastChecked: '最近核对',
		lastCheckedDate: '2026年8月28日',
		independent: '独立指南。不是政府网站。',
		contribute: {
			before: '',
			linkLabel: 'GitHub',
			after: ' 可提交 pull request。',
		},
		madeBy: {
			before: '由 ',
			ronakLabel: 'Ronak',
			middle: ' 和 ',
			ayushmanLabel: 'Ayushman',
			beforeYanbo: ' ',
			yanboLabel: 'yanbo',
			after: ' 制作。',
		},
		changelog: [
			{
				date: '2026年8月29日',
				note: '在 /zh/ 增加了简体中文版。',
			},
			{
				date: '2026年8月28日',
				note: '将 UPI 和 Alipay+ 分成独立区块，并附官方门户截图。增加汇款与 SWIFT 账户，以及开启国际卡支付的说明。',
			},
			{
				date: '2026年8月28日',
				note: '标出私人募捐禁令、加密钱包和喜马拉雅银行美元通道。官方链接在新标签页打开。',
			},
			{
				date: '2026年8月28日',
				note: '收紧页面层级，让汇款路径和防骗检查先被读到。',
			},
			{
				date: '2026年8月28日',
				note: '增加已公布的基金总额及报道日期。',
			},
			{
				date: '2026年8月28日',
				note: '增加常见问题和机构结构化数据。',
			},
			{
				date: '2026年8月28日',
				note: '增加救援人员正在发放的物资，并标明这不是政府清单。',
			},
			{
				date: '2026年8月28日',
				note: '增加尼泊尔语版本和分享区块。',
			},
			{
				date: '2026年8月28日',
				note: '增加灾情摘要和本变更记录。',
			},
			{
				date: '2026年8月28日',
				note: '重写汇款区块，并增加防骗检查。',
			},
		],
	},
} as const;
