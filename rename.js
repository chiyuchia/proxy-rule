/**
 * Sub-Store 节点地区标注脚本
 * 通过节点名匹配或 IP 查询为节点添加地区标签（国旗 + 中文地区名 + 序号）
 *
 * 参数 (通过 $arguments 传入):
 *   remove: boolean              是否删除原节点名，默认 true
 *   filter: string               过滤词，节点名匹配则直接丢弃，不参与后续处理
 *                                默认应用内置预设（过期|剩余|官网|套餐|重置|到期|Traffic|Expire）
 *                                传空值（filter=）禁用过滤；传词组则追加到内置预设
 *                                例如: "测试|备用"
 *   block: string                屏蔽词，多个用 | 连接，匹配前从节点名中去除，不影响输出原名
 *                                例如: "TG:LSMOO|公益|测试"
 *   token: string                IPinfo API Token，不传则使用标准 API: https://ipinfo.io/{ip}/json（有限速）
 *   one: boolean                 去掉只有一个节点的地区的序号（01），默认 false
 *   hot: boolean|string          只保留热门地区节点，默认不过滤
 *                                传 true/1 使用预设热门地区（HK/TW/CN/JP/SG/US）
 *                                传 "HK|SG|JP" 形式则只保留指定地区
 *   retain: string               remove=true 时从原节点名中提取并保留的关键词，默认启用内置关键词提取
 *                                传 false/0 禁用；传词组则在内置基础上追加自定义关键词
 *                                多个用 | 连接，例如: "IPLC|专线"
 *   out: string                  国家标签的组成部分，默认 "FG|EN"
 *                                可选值：FG（旗帜）、ZH（中文名）、EN（英文代码）、QC（英文全称）
 *                                多个用 | 连接，按顺序拼接，例如: "FG|ZH"、"ZH"、"FG|ZH|EN"
 *
 * 输出格式 (默认 out=FG|EN):
 *   remove=false: "_subName 🇺🇸 US 01 | 原节点名"
 *   remove=true 未传 retain:          "_subName 🇺🇸 US 01"
 *   remove=true 传 retain 有命中:     "_subName 🇺🇸 US 01 | 东京 IPLC"
 *   remove=true 传 retain 无命中:     "_subName 🇺🇸 US 01"
 */

// prettier-ignore
const EN = ['CN','HK','MO','TW','JP','KR','SG','US','GB','FR','DE','AU','AE','AF','AL','DZ','AO','AR','AM','AT','AZ','BH','BD','BY','BE','BZ','BJ','BT','BO','BA','BW','BR','VG','BN','BG','BF','BI','KH','CM','CA','CV','KY','CF','TD','CL','CO','KM','CG','CD','CR','HR','CY','CZ','DK','DJ','DO','EC','EG','SV','GQ','ER','EE','ET','FJ','FI','GA','GM','GE','GH','GR','GL','GT','GN','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','CI','JM','JO','KZ','KE','KW','KG','LA','LV','LB','LS','LR','LY','LT','LU','MK','MG','MW','MY','MV','ML','MT','MR','MU','MX','MD','MC','MN','ME','MA','MZ','MM','NA','NP','NL','NZ','NI','NE','NG','KP','NO','OM','PK','PA','PY','PE','PH','PT','PR','QA','RO','RU','RW','SM','SA','SN','RS','SL','SK','SI','SO','ZA','ES','LK','SD','SR','SZ','SE','CH','SY','TJ','TZ','TH','TG','TO','TT','TN','TR','TM','VI','UG','UA','UY','UZ','VE','VN','YE','ZM','ZW','AD','RE','PL','GU','VA','LI','CW','SC','AQ','GI','CU','FO','AX','BM','TL'];
// prettier-ignore
const ZH = ['中国','香港','澳门','台湾','日本','韩国','新加坡','美国','英国','法国','德国','澳大利亚','阿联酋','阿富汗','阿尔巴尼亚','阿尔及利亚','安哥拉','阿根廷','亚美尼亚','奥地利','阿塞拜疆','巴林','孟加拉国','白俄罗斯','比利时','伯利兹','贝宁','不丹','玻利维亚','波斯尼亚和黑塞哥维那','博茨瓦纳','巴西','英属维京群岛','文莱','保加利亚','布基纳法索','布隆迪','柬埔寨','喀麦隆','加拿大','佛得角','开曼群岛','中非共和国','乍得','智利','哥伦比亚','科摩罗','刚果(布)','刚果(金)','哥斯达黎加','克罗地亚','塞浦路斯','捷克','丹麦','吉布提','多米尼加共和国','厄瓜多尔','埃及','萨尔瓦多','赤道几内亚','厄立特里亚','爱沙尼亚','埃塞俄比亚','斐济','芬兰','加蓬','冈比亚','格鲁吉亚','加纳','希腊','格陵兰','危地马拉','几内亚','圭亚那','海地','洪都拉斯','匈牙利','冰岛','印度','印尼','伊朗','伊拉克','爱尔兰','马恩岛','以色列','意大利','科特迪瓦','牙买加','约旦','哈萨克斯坦','肯尼亚','科威特','吉尔吉斯斯坦','老挝','拉脱维亚','黎巴嫩','莱索托','利比里亚','利比亚','立陶宛','卢森堡','马其顿','马达加斯加','马拉维','马来','马尔代夫','马里','马耳他','毛利塔尼亚','毛里求斯','墨西哥','摩尔多瓦','摩纳哥','蒙古','黑山共和国','摩洛哥','莫桑比克','缅甸','纳米比亚','尼泊尔','荷兰','新西兰','尼加拉瓜','尼日尔','尼日利亚','朝鲜','挪威','阿曼','巴基斯坦','巴拿马','巴拉圭','秘鲁','菲律宾','葡萄牙','波多黎各','卡塔尔','罗马尼亚','俄罗斯','卢旺达','圣马力诺','沙特阿拉伯','塞内加尔','塞尔维亚','塞拉利昂','斯洛伐克','斯洛文尼亚','索马里','南非','西班牙','斯里兰卡','苏丹','苏里南','斯威士兰','瑞典','瑞士','叙利亚','塔吉克斯坦','坦桑尼亚','泰国','多哥','汤加','特立尼达和多巴哥','突尼斯','土耳其','土库曼斯坦','美属维尔京群岛','乌干达','乌克兰','乌拉圭','乌兹别克斯坦','委内瑞拉','越南','也门','赞比亚','津巴布韦','安道尔','留尼汪','波兰','关岛','梵蒂冈','列支敦士登','库拉索','塞舌尔','南极','直布罗陀','古巴','法罗群岛','奥兰群岛','百慕达','东帝汶'];
// prettier-ignore
const QC = ['China','Hong Kong','Macao','Taiwan','Japan','Korea','Singapore','United States','United Kingdom','France','Germany','Australia','Dubai','Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Austria','Azerbaijan','Bahrain','Bangladesh','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','British Virgin Islands','Brunei','Bulgaria','Burkina-faso','Burundi','Cambodia','Cameroon','Canada','CapeVerde','CaymanIslands','Central African Republic','Chad','Chile','Colombia','Comoros','Congo-Brazzaville','Congo-Kinshasa','CostaRica','Croatia','Cyprus','Czech Republic','Denmark','Djibouti','Dominican Republic','Ecuador','Egypt','EISalvador','Equatorial Guinea','Eritrea','Estonia','Ethiopia','Fiji','Finland','Gabon','Gambia','Georgia','Ghana','Greece','Greenland','Guatemala','Guinea','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Isle of Man','Israel','Italy','Ivory Coast','Jamaica','Jordan','Kazakstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Lithuania','Luxembourg','Macedonia','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Mauritania','Mauritius','Mexico','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar(Burma)','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','NorthKorea','Norway','Oman','Pakistan','Panama','Paraguay','Peru','Philippines','Portugal','PuertoRico','Qatar','Romania','Russia','Rwanda','SanMarino','SaudiArabia','Senegal','Serbia','SierraLeone','Slovakia','Slovenia','Somalia','SouthAfrica','Spain','SriLanka','Sudan','Suriname','Swaziland','Sweden','Switzerland','Syria','Tajikstan','Tanzania','Thailand','Togo','Tonga','TrinidadandTobago','Tunisia','Turkey','Turkmenistan','U.S.Virgin Islands','Uganda','Ukraine','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe','Andorra','Reunion','Poland','Guam','Vatican','Liechtensteins','Curacao','Seychelles','Antarctica','Gibraltar','Cuba','Faroe Islands','Ahvenanmaa','Bermuda','Timor-Leste'];
// prettier-ignore
const FG = ['🇨🇳','🇭🇰','🇲🇴','🇹🇼','🇯🇵','🇰🇷','🇸🇬','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇦🇺','🇦🇪','🇦🇫','🇦🇱','🇩🇿','🇦🇴','🇦🇷','🇦🇲','🇦🇹','🇦🇿','🇧🇭','🇧🇩','🇧🇾','🇧🇪','🇧🇿','🇧🇯','🇧🇹','🇧🇴','🇧🇦','🇧🇼','🇧🇷','🇻🇬','🇧🇳','🇧🇬','🇧🇫','🇧🇮','🇰🇭','🇨🇲','🇨🇦','🇨🇻','🇰🇾','🇨🇫','🇹🇩','🇨🇱','🇨🇴','🇰🇲','🇨🇬','🇨🇩','🇨🇷','🇭🇷','🇨🇾','🇨🇿','🇩🇰','🇩🇯','🇩🇴','🇪🇨','🇪🇬','🇸🇻','🇬🇶','🇪🇷','🇪🇪','🇪🇹','🇫🇯','🇫🇮','🇬🇦','🇬🇲','🇬🇪','🇬🇭','🇬🇷','🇬🇱','🇬🇹','🇬🇳','🇬🇾','🇭🇹','🇭🇳','🇭🇺','🇮🇸','🇮🇳','🇮🇩','🇮🇷','🇮🇶','🇮🇪','🇮🇲','🇮🇱','🇮🇹','🇨🇮','🇯🇲','🇯🇴','🇰🇿','🇰🇪','🇰🇼','🇰🇬','🇱🇦','🇱🇻','🇱🇧','🇱🇸','🇱🇷','🇱🇾','🇱🇹','🇱🇺','🇲🇰','🇲🇬','🇲🇼','🇲🇾','🇲🇻','🇲🇱','🇲🇹','🇲🇷','🇲🇺','🇲🇽','🇲🇩','🇲🇨','🇲🇳','🇲🇪','🇲🇦','🇲🇿','🇲🇲','🇳🇦','🇳🇵','🇳🇱','🇳🇿','🇳🇮','🇳🇪','🇳🇬','🇰🇵','🇳🇴','🇴🇲','🇵🇰','🇵🇦','🇵🇾','🇵🇪','🇵🇭','🇵🇹','🇵🇷','🇶🇦','🇷🇴','🇷🇺','🇷🇼','🇸🇲','🇸🇦','🇸🇳','🇷🇸','🇸🇱','🇸🇰','🇸🇮','🇸🇴','🇿🇦','🇪🇸','🇱🇰','🇸🇩','🇸🇷','🇸🇿','🇸🇪','🇨🇭','🇸🇾','🇹🇯','🇹🇿','🇹🇭','🇹🇬','🇹🇴','🇹🇹','🇹🇳','🇹🇷','🇹🇲','🇻🇮','🇺🇬','🇺🇦','🇺🇾','🇺🇿','🇻🇪','🇻🇳','🇾🇪','🇿🇲','🇿🇼','🇦🇩','🇷🇪','🇵🇱','🇬🇺','🇻🇦','🇱🇮','🇨🇼','🇸🇨','🇦🇶','🇬🇮','🇨🇺','🇫🇴','🇦🇽','🇧🇲','🇹🇱'];

const EN_TO_ZH = new Map(EN.map((code, i) => [code, ZH[i]]));
const CONCURRENCY = 5;

// 热门地区（hot 参数过滤用）
const HOT_REGIONS = new Set(["HK", "TW", "CN", "JP", "SG", "US"]);

// 节点名预处理替换表：将别名/城市名替换为标准地区名，便于后续 ZH/QC 匹配
// key 为替换目标（ZH 或 QC 数组中的值），value 为匹配正则
const RURE_KEY = {
  香港: /Hongkong|HONG KONG|HKG|港(?!.*线)/gi,
  台湾: /新台|新北|TPE|TSA|台(?!.*线)/g,
  Taiwan: /Taipei/g,
  日本: /东京|大坂|NRT|HND|KIX|OSA|(深|沪|呼|京|广|杭|中|辽)日(?!.*(I|线))/g,
  Japan: /Tokyo|Osaka/g,
  韩国: /春川|首尔|ICN|GMP|韩(?!.*国)/g,
  Korea: /Seoul|Chuncheon/g,
  新加坡: /狮城|SIN|(深|沪|呼|京|广|杭)新/g,
  美国: /USA|LAX|SJC|SEA|SFO|JFK|EWR|IAD|ORD|DFW|MIA|ATL|IAH|PHX|DEN|LAS|BOS|Los Angeles|San Jose|Silicon Valley|Michigan|波特兰|芝加哥|哥伦布|纽约|硅谷|俄勒冈|西雅图|(深|沪|呼|京|广|杭)美/g,
  英国: /伦敦|LHR|LGW|STN|MAN|BHX|EDI|GLA/g,
  "United Kingdom": /UK|Great Britain|London/g,
  澳大利亚: /澳洲|墨尔本|悉尼|SYD|MEL|BNE|PER|ADL|CBR|(深|沪|呼|京|广|杭)澳/g,
  Australia: /Sydney|Melbourne/g,
  德国: /法兰克福|FRA|MUC|DUS|BER|HAM|STR|CGN|(深|沪|呼|京|广|杭)德(?!.*(I|线))/g,
  Germany: /Frankfurt/g,
  俄罗斯: /莫斯科|SVO|DME|LED|VKO/g,
  Russia: /Moscow/g,
  土耳其: /伊斯坦布尔|IST|SAW|ESB/g,
  Turkey: /Istanbul/g,
  印度: /孟买|BOM|DEL|BLR|MAA|CCU|HYD/g,
  India: /Mumbai/g,
  印尼: /印度尼西亚|雅加达|CGK|SUB|DPS/g,
  Indonesia: /Jakarta/g,
  法国: /巴黎|CDG|ORY|LYS|NCE|MRS/g,
  France: /Paris/g,
  Switzerland: /Zurich|ZRH|GVA/g,
  阿联酋: /迪拜|阿拉伯联合酋长国|DXB|AUH|SHJ/g,
  Dubai: /United Arab Emirates/g,
  泰国: /泰國|曼谷|BKK|DMK|HKT/g,
  中国: /中國/g,
  // 新增地区机场代码
  荷兰: /AMS/g,
  马来: /KUL|PEN|BKI/g,
  菲律宾: /MNL|CEB/g,
  加拿大: /YYZ|YVR|YUL|YYC|YEG|YOW/g,
  波兰: /WAW|KRK/g,
  捷克: /PRG/g,
  奥地利: /VIE/g,
  匈牙利: /BUD/g,
  比利时: /BRU/g,
  葡萄牙: /LIS|OPO/g,
  西班牙: /MAD|BCN/g,
  意大利: /FCO|MXP|VCE/g,
  挪威: /OSL/g,
  瑞典: /ARN/g,
  芬兰: /HEL/g,
  丹麦: /CPH/g,
  罗马尼亚: /OTP/g,
  以色列: /TLV/g,
  沙特阿拉伯: /RUH|JED/g,
  卡塔尔: /DOH/g,
  南非: /JNB|CPT/g,
  墨西哥: /MEX|CUN/g,
  阿根廷: /EZE/g,
  哥伦比亚: /BOG/g,
  巴西: /GRU|GIG/g,
};

/**
 * 用节点名全量匹配地区，参考 rename.js 逻辑
 * 先用 RURE_KEY 预处理替换别名，再依次尝试 ZH、FG、QC、EN 四个数组的 includes 匹配
 * 返回 country_code 或 null
 */
function matchNameToCode(name) {
  // 预处理：将别名/城市名替换为标准地区名
  let processed = name;
  for (const [target, regex] of Object.entries(RURE_KEY)) {
    if (regex.test(processed)) {
      processed = processed.replace(regex, target);
    }
  }
  // 先尝试 ZH（中文）
  for (let i = 0; i < ZH.length; i++) {
    if (processed.includes(ZH[i])) return EN[i];
  }
  // 再尝试 FG（国旗 emoji）
  for (let i = 0; i < FG.length; i++) {
    if (processed.includes(FG[i])) return EN[i];
  }
  // 再尝试 QC（英文全称）
  for (let i = 0; i < QC.length; i++) {
    if (processed.includes(QC[i])) return EN[i];
  }
  // 最后尝试 EN 代码直接匹配（支持前后有特殊符号，如 US_1|1.0MB/s、HK-01 等）
  for (let i = 0; i < EN.length; i++) {
    const re = new RegExp(`(?<![A-Za-z])${EN[i]}(?![A-Za-z])`, "i");
    if (re.test(processed)) return EN[i];
  }
  return null;
}

/**
 * 从节点名中提取 RURE_KEY 命中的城市/别名关键词（原始文本）
 * 返回第一个命中的原始匹配文本，未命中返回 null
 */
function extractCityKeyword(name) {
  for (const regex of Object.values(RURE_KEY)) {
    // 重置 lastIndex（全局正则有状态）
    regex.lastIndex = 0;
    const match = regex.exec(name);
    if (match) return match[0];
  }
  return null;
}

// 内置过滤词预设：节点名匹配则直接丢弃（可通过 filter 参数追加，传空值禁用）
const DEFAULT_FILTER_WORDS = [
  "过期",
  "剩余",
  "官网",
  "套餐",
  "重置",
  "到期",
  "Traffic",
  "Expire",
];
const RETAIN_KEYWORDS = [
  // 日本
  "东京",
  "大坂",
  "Tokyo",
  "Osaka",
  "NRT",
  "HND",
  "KIX",
  "OSA",
  // 韩国
  "首尔",
  "春川",
  "Seoul",
  "Chuncheon",
  "ICN",
  "GMP",
  // 美国
  "纽约",
  "洛杉矶",
  "硅谷",
  "西雅图",
  "芝加哥",
  "波特兰",
  "哥伦布",
  "俄勒冈",
  "Los Angeles",
  "San Jose",
  "Silicon Valley",
  "New York",
  "Seattle",
  "Chicago",
  "LAX",
  "SJC",
  "SEA",
  "SFO",
  "JFK",
  "EWR",
  "IAD",
  "ORD",
  "DFW",
  "MIA",
  "ATL",
  "IAH",
  "PHX",
  "DEN",
  "LAS",
  "BOS",
  // 英国
  "伦敦",
  "London",
  "LHR",
  "LGW",
  "STN",
  "MAN",
  // 澳大利亚
  "悉尼",
  "墨尔本",
  "Sydney",
  "Melbourne",
  "SYD",
  "MEL",
  "BNE",
  "PER",
  // 德国
  "法兰克福",
  "Frankfurt",
  "FRA",
  "MUC",
  "BER",
  // 俄罗斯
  "莫斯科",
  "Moscow",
  "SVO",
  "DME",
  // 土耳其
  "伊斯坦布尔",
  "Istanbul",
  "IST",
  "SAW",
  // 印度
  "孟买",
  "Mumbai",
  "BOM",
  "DEL",
  "BLR",
  // 印尼
  "雅加达",
  "Jakarta",
  "CGK",
  "DPS",
  // 法国
  "巴黎",
  "Paris",
  "CDG",
  "ORY",
  // 瑞士
  "苏黎世",
  "Zurich",
  "ZRH",
  // 阿联酋
  "迪拜",
  "Dubai",
  "DXB",
  "AUH",
  // 泰国
  "曼谷",
  "Bangkok",
  "BKK",
  "DMK",
  // 台湾
  "台北",
  "Taipei",
  "TPE",
  // 荷兰
  "阿姆斯特丹",
  "Amsterdam",
  "AMS",
  // 加拿大
  "多伦多",
  "温哥华",
  "Toronto",
  "Vancouver",
  "YYZ",
  "YVR",
  // 马来西亚
  "吉隆坡",
  "Kuala Lumpur",
  "KUL",
  // 菲律宾
  "马尼拉",
  "Manila",
  "MNL",
  // 波兰
  "华沙",
  "Warsaw",
  "WAW",
  // 捷克
  "布拉格",
  "Prague",
  "PRG",
  // 奥地利
  "维也纳",
  "Vienna",
  "VIE",
  // 西班牙
  "马德里",
  "巴塞罗那",
  "Madrid",
  "Barcelona",
  "MAD",
  "BCN",
  // 意大利
  "米兰",
  "罗马",
  "Milan",
  "Rome",
  "MXP",
  "FCO",
  // 葡萄牙
  "里斯本",
  "Lisbon",
  "LIS",
  // 瑞典
  "斯德哥尔摩",
  "Stockholm",
  "ARN",
  // 芬兰
  "赫尔辛基",
  "Helsinki",
  "HEL",
  // 丹麦
  "哥本哈根",
  "Copenhagen",
  "CPH",
  // 挪威
  "奥斯陆",
  "Oslo",
  "OSL",
  // 以色列
  "特拉维夫",
  "Tel Aviv",
  "TLV",
  // 沙特阿拉伯
  "利雅得",
  "吉达",
  "Riyadh",
  "Jeddah",
  "RUH",
  "JED",
  // 卡塔尔
  "多哈",
  "Doha",
  "DOH",
  // 南非
  "约翰内斯堡",
  "Johannesburg",
  "JNB",
  // 巴西
  "圣保罗",
  "Sao Paulo",
  "GRU",
  // 墨西哥
  "墨西哥城",
  "Mexico City",
  "MEX",

  "via",

  //VPS商/专线常见词
  "BAGE",
  "GOMAMI",
  "AKARI",
  "DMIT",
  "NETCUP",
  "NUBE",
  "MISAKA",
  "家宽",
  "专线",
  "高级专线",
  "IEPL",
  "Edge",
  "HKT",
  "HINET",
];

/**
 * 从原节点名中提取命中的保留关键词列表
 * 先匹配城市关键词，再匹配用户自定义 retainKeys
 * 返回命中词数组（去重），未命中返回空数组
 */
function extractRetainKeywords(name, retainKeys) {
  const hits = [];
  for (const kw of RETAIN_KEYWORDS) {
    if (name.includes(kw) && !hits.includes(kw)) hits.push(kw);
  }
  for (const kw of retainKeys) {
    if (name.includes(kw) && !hits.includes(kw)) hits.push(kw);
  }
  // 按关键词在原节点名中的首次出现位置排序，保留源词序
  hits.sort((a, b) => name.indexOf(a) - name.indexOf(b));
  return hits;
}

async function operator(proxies, targetPlatform, context) {
  const removeOriginalName =
    $arguments?.remove === undefined ? true : !!$arguments.remove;
  const numone = !!$arguments?.one;
  const hotArg = $arguments?.hot;
  const hotRegions = (() => {
    if (!hotArg) return null;
    const codes = String(hotArg)
      .toUpperCase()
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    const matched = new Set(codes.filter((c) => EN.includes(c) || c === "CN"));
    return matched.size > 0 ? matched : HOT_REGIONS;
  })();
  const hotOnly = hotRegions !== null;
  const filterWordsRaw = $arguments?.filter;
  const filterRegex = (() => {
    // 传空值：禁用过滤
    if (filterWordsRaw !== undefined && String(filterWordsRaw).trim() === "")
      return null;
    const custom = filterWordsRaw
      ? decodeURIComponent(String(filterWordsRaw))
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const words = [...DEFAULT_FILTER_WORDS, ...custom];
    return new RegExp(
      words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
      "i",
    );
  })();
  const blockWordsRaw = $arguments?.block;
  const blockRegex = blockWordsRaw
    ? new RegExp(decodeURIComponent(String(blockWordsRaw)), "gi")
    : null;
  const API_TOKEN = $arguments?.token || "";
  const retainKeysRaw = $arguments?.retain;
  // 默认启用内置关键词提取（等同于 retain=true）；传 false/0 禁用；传词组则追加自定义词
  const retainKeys = (() => {
    if (retainKeysRaw === undefined) return [];
    const s = String(retainKeysRaw).trim();
    if (s === "0" || s.toLowerCase() === "false") return null;
    return s
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s && s !== "1" && s.toLowerCase() !== "true");
  })();
  const VALID_OUT = new Set(["FG", "ZH", "EN", "QC"]);
  const outParts = ($arguments?.out ? String($arguments.out) : "FG|EN")
    .split("|")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => VALID_OUT.has(s));
  const outFields = outParts.length > 0 ? outParts : ["FG", "EN"];

  console.log(
    `[geo-tag] 开始处理，共 ${proxies.length} 个节点，removeOriginalName=${removeOriginalName}，hotOnly=${hotOnly}`,
  );

  if (filterRegex) {
    const before = proxies.length;
    proxies = proxies.filter((p) => !filterRegex.test(p.name));
    console.log(
      `[geo-tag] filter 过滤: ${before - proxies.length} 个节点被丢弃，剩余 ${proxies.length} 个`,
    );
  }

  let nameHitCount = 0;
  let missCount = 0;
  let errorCount = 0;

  // 第一阶段：用节点名全量匹配地区，命中则写入 countryMap，跳过 API
  const countryMap = new Map(); // `${server}:${port}` -> country_code
  const serverKey = (p) => `${p.server}:${p.port}`;

  for (const proxy of proxies) {
    if (!proxy.server) continue;
    let cleanName = blockRegex
      ? proxy.name.replace(blockRegex, "")
      : proxy.name;
    // 自动剥离节点名中的域名（含点的多级域名），避免误匹配国家代码
    cleanName = cleanName.replace(
      /[a-zA-Z0-9]([a-zA-Z0-9-]*\.)+[a-zA-Z]+/g,
      "",
    );
    const code = matchNameToCode(cleanName);
    if (code) {
      countryMap.set(serverKey(proxy), code);
      nameHitCount++;
      console.log(`[geo-tag] 名称命中: ${proxy.name} → ${code}`);
    }
  }
  console.log(`[geo-tag] 名称命中 ${nameHitCount}/${proxies.length} 个节点`);

  // 未命中的节点，走 DoH → API 流程
  const apiProxies = proxies.filter(
    (p) => p.server && !countryMap.has(serverKey(p)),
  );
  console.log(`[geo-tag] 需要 API 查询: ${apiProxies.length} 个节点`);

  for (let i = 0; i < apiProxies.length; i += CONCURRENCY) {
    const batch = apiProxies.slice(i, i + CONCURRENCY);
    console.log(
      `[geo-tag] 查询批次 ${Math.floor(i / CONCURRENCY) + 1}，节点 ${i + 1}-${Math.min(i + CONCURRENCY, apiProxies.length)}`,
    );

    await Promise.all(
      batch.map(async (proxy) => {
        const server = proxy.server;
        if (!server) return;

        missCount++;

        // 域名先 DoH 解析
        let queryTarget = server;
        if (!/^[\d.]+$/.test(server) && !server.includes(":")) {
          const ip = await resolveHost(server);
          if (ip) {
            console.log(`[geo-tag] 域名解析: ${server} → ${ip}`);
            queryTarget = ip;
          } else {
            console.log(`[geo-tag] 域名解析失败，跳过: ${server}`);
            errorCount++;
            return;
          }
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);

        try {
          const url = API_TOKEN
            ? `https://api.ipinfo.io/lite/${queryTarget}?token=${API_TOKEN}`
            : `https://ipinfo.io/${queryTarget}/json`;
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timer);

          const data = await response.json();
          const countryCode = data.country_code || data.country;
          console.log(
            `[geo-tag] API 响应: ${server} → country_code=${countryCode}, as_name=${data.as_name || data.org}`,
          );

          if (countryCode) {
            countryMap.set(serverKey(proxy), countryCode);
          } else {
            console.log(
              `[geo-tag] API 未返回 country_code: ${server}，响应: ${JSON.stringify(data)}`,
            );
          }
        } catch (e) {
          clearTimeout(timer);
          errorCount++;
          const reason = e.name === "AbortError" ? "请求超时(3s)" : e.message;
          console.log(`[geo-tag] 查询失败: ${server}，原因: ${reason}`);
        }
      }),
    );
  }

  // 第二阶段：按 _subName + country_code 分组计数，生成新名称
  const counterMap = new Map(); // `${subName}|${countryCode}` -> 当前计数

  const renamedProxies = proxies.map((proxy) => {
    const server = proxy.server;
    const countryCode = server ? countryMap.get(serverKey(proxy)) : null;

    if (!countryCode) {
      return proxy;
    }

    const subName = proxy._subName || "";
    const flag = getFlagEmoji(countryCode);
    const zhName = EN_TO_ZH.get(countryCode) || countryCode;
    const qcName = QC[EN.indexOf(countryCode)] || countryCode;
    const countryLabel = outFields
      .map((f) =>
        f === "FG"
          ? flag
          : f === "ZH"
            ? zhName
            : f === "QC"
              ? qcName
              : countryCode,
      )
      .join(" ");
    const key = `${subName}|${countryCode}`;

    const count = (counterMap.get(key) || 0) + 1;
    counterMap.set(key, count);
    const seq = String(count).padStart(2, "0");

    const newName = removeOriginalName
      ? (() => {
          if (!retainKeys) return `${subName} ${countryLabel} ${seq}`;
          const retained = extractRetainKeywords(proxy.name, retainKeys);
          const base = `${subName} ${countryLabel} ${seq}`;
          return retained.length > 0 ? `${base} | ${retained.join(" ")}` : base;
        })()
      : `${subName} ${countryLabel} ${seq} | ${proxy.name}`;

    console.log(`[geo-tag] 重命名: ${proxy.name} → ${newName}`);
    return { ...proxy, name: newName };
  });

  console.log(
    `[geo-tag] 完成。名称命中: ${nameHitCount}，API 查询: ${missCount}，失败: ${errorCount}`,
  );

  // hot 参数：只保留热门地区节点
  let result = hotOnly
    ? renamedProxies.filter((p) => {
        const code = p.server ? countryMap.get(serverKey(p)) : null;
        return code && hotRegions.has(code);
      })
    : renamedProxies;

  if (hotOnly) {
    console.log(`[geo-tag] hot 过滤后剩余: ${result.length} 个节点`);
  }

  // 第三阶段：热门地区优先，内部按 country_code 字母序；其余也按字母序；无归属地排最后
  result.sort((a, b) => {
    const ca = a.server ? countryMap.get(serverKey(a)) : null;
    const cb = b.server ? countryMap.get(serverKey(b)) : null;
    if (!ca && !cb) return 0;
    if (!ca) return 1;
    if (!cb) return -1;
    const hotA = HOT_REGIONS.has(ca);
    const hotB = HOT_REGIONS.has(cb);
    if (hotA && !hotB) return -1;
    if (!hotA && hotB) return 1;
    return ca.localeCompare(cb) || a.name.localeCompare(b.name);
  });

  // one 参数：去掉只有一个节点的地区的序号
  if (numone) {
    const nameCount = new Map();
    for (const p of result) {
      const base = p.name.replace(
        /\s+\d{2}(\s*\|.*)?$/,
        (_, suffix) => suffix || "",
      );
      nameCount.set(base, (nameCount.get(base) || 0) + 1);
    }
    for (const p of result) {
      const base = p.name.replace(
        /\s+\d{2}(\s*\|.*)?$/,
        (_, suffix) => suffix || "",
      );
      if (nameCount.get(base) === 1) {
        p.name = p.name.replace(/\s+01(\s*\|)/, "$1").replace(/\s+01$/, "");
      }
    }
  }

  return result;
}

/**
 * 国家代码转 Emoji 旗帜
 */
function getFlagEmoji(countryCode) {
  if (!countryCode) return "🌐";
  return countryCode
    .toUpperCase()
    .replace(/[A-Z]/gu, (char) =>
      String.fromCodePoint(char.charCodeAt(0) + 127397),
    );
}

/**
 * 用 Cloudflare DoH 将域名解析为 IPv4 地址
 * 返回第一个 A 记录的 IP，失败返回 null
 */
async function resolveHost(hostname) {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/dns-json" },
    });
    clearTimeout(timer);
    const data = await response.json();
    const record = data.Answer?.find((r) => r.type === 1);
    return record?.data || null;
  } catch (e) {
    console.log(`[geo-tag] DoH 解析失败: ${hostname}，原因: ${e.message}`);
    return null;
  }
}
