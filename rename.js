/**
 * Sub-Store IP 地区反查脚本
 * 使用 IPinfo Lite API: https://api.ipinfo.io/lite/{ip}?token=TOKEN
 *
 * 参数 (通过 $arguments 传入):
 *   remove: boolean              是否删除原节点名，默认 false
 *   block: string                屏蔽词，多个用 | 连接，匹配前从节点名中去除，不影响输出原名
 *                                例如: "TG:LSMOO|公益|测试"
 *   token: string                IPinfo API Token，不传则使用标准 API: https://ipinfo.io/{ip}/json（有限速）
 *   one: boolean                 去掉只有一个节点的地区的序号（01），默认 false
 *   hot: boolean|string          只保留热门地区节点，默认 false
 *                                传 true/1 使用预设热门地区（HK/TW/CN/JP/SG/US）
 *                                传 "HK|SG|JP" 形式则只保留指定地区
 *
 * 输出格式:
 *   remove=false: "_subName 🇺🇸 美国 01 | 原节点名"
 *   remove=true:  "_subName 🇺🇸 美国 01"
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

// 节点名预处理替换表（参考 rename.js rurekey）
const RURE_KEY = {
  HK: [/Hongkong|HONG KONG/gi, /港/],
  TW: [/台(?!.*线)/g, /Taipei/g],
  JP: [/东京|大坂|Tokyo|Osaka/g],
  KR: [/春川|首尔|Seoul|Chuncheon/g],
  SG: [/狮城/g],
  US: [
    /USA|Los Angeles|San Jose|Silicon Valley|Michigan|波特兰|芝加哥|哥伦布|纽约|硅谷|俄勒冈|西雅图/g,
  ],
  GB: [/UK|London|Great Britain|伦敦/g],
  DE: [/Frankfurt|法兰克福/g],
  AU: [/澳洲|墨尔本|悉尼|Sydney|Melbourne/g],
  RU: [/Moscow|莫斯科/g],
  TR: [/Istanbul|伊斯坦布尔/g],
  IN: [/Mumbai|孟买/g],
  ID: [/Jakarta|雅加达/g],
  FR: [/Paris|巴黎/g],
  CH: [/Zurich/g],
  CN: [/中国|中國|China/g],
};

/**
 * 用节点名全量匹配地区，参考 rename.js 逻辑
 * 依次尝试 ZH、FG、QC、EN 四个数组的 includes 匹配
 * 返回 country_code 或 null
 */
function matchNameToCode(name) {
  // 先尝试 ZH（中文）
  for (let i = 0; i < ZH.length; i++) {
    if (name.includes(ZH[i])) return EN[i];
  }
  // 再尝试 FG（国旗 emoji）
  for (let i = 0; i < FG.length; i++) {
    if (name.includes(FG[i])) return EN[i];
  }
  // 再尝试 QC（英文全称）
  for (let i = 0; i < QC.length; i++) {
    if (name.includes(QC[i])) return EN[i];
  }
  // 最后尝试 EN（英文缩写）
  for (let i = 0; i < EN.length; i++) {
    if (name.includes(EN[i])) return EN[i];
  }
  return null;
}

async function operator(proxies, targetPlatform, context) {
  const removeOriginalName = !!$arguments?.remove;
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
  const blockWordsRaw = $arguments?.block;
  const blockRegex = blockWordsRaw
    ? new RegExp(decodeURIComponent(String(blockWordsRaw)), "gi")
    : null;
  const API_TOKEN = $arguments?.token || "";

  console.log(
    `[geo-tag] 开始处理，共 ${proxies.length} 个节点，removeOriginalName=${removeOriginalName}，hotOnly=${hotOnly}`,
  );

  let nameHitCount = 0;
  let missCount = 0;
  let errorCount = 0;

  // 第一阶段：用节点名全量匹配地区，命中则写入 countryMap，跳过 API
  const countryMap = new Map(); // server -> country_code

  for (const proxy of proxies) {
    if (!proxy.server) continue;
    const cleanName = blockRegex
      ? proxy.name.replace(blockRegex, "")
      : proxy.name;
    const code = matchNameToCode(cleanName);
    if (code) {
      countryMap.set(proxy.server, code);
      nameHitCount++;
      console.log(`[geo-tag] 名称命中: ${proxy.name} → ${code}`);
    }
  }
  console.log(`[geo-tag] 名称命中 ${nameHitCount}/${proxies.length} 个节点`);

  // 未命中的节点，走 DoH → API 流程
  const apiProxies = proxies.filter(
    (p) => p.server && !countryMap.has(p.server),
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
            countryMap.set(server, countryCode);
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
    const countryCode = server ? countryMap.get(server) : null;

    if (!countryCode) {
      return proxy;
    }

    const subName = proxy._subName || "";
    const flag = getFlagEmoji(countryCode);
    const zhName = EN_TO_ZH.get(countryCode) || countryCode;
    const key = `${subName}|${countryCode}`;

    const count = (counterMap.get(key) || 0) + 1;
    counterMap.set(key, count);
    const seq = String(count).padStart(2, "0");

    const newName = removeOriginalName
      ? `${subName} ${flag} ${zhName} ${seq}`
      : `${subName} ${flag} ${zhName} ${seq} | ${proxy.name}`;

    console.log(`[geo-tag] 重命名: ${proxy.name} → ${newName}`);
    return { ...proxy, name: newName };
  });

  console.log(
    `[geo-tag] 完成。名称命中: ${nameHitCount}，API 查询: ${missCount}，失败: ${errorCount}`,
  );

  // hot 参数：只保留热门地区节点
  let result = hotOnly
    ? renamedProxies.filter((p) => {
        const code = p.server ? countryMap.get(p.server) : null;
        return code && hotRegions.has(code);
      })
    : renamedProxies;

  if (hotOnly) {
    console.log(`[geo-tag] hot 过滤后剩余: ${result.length} 个节点`);
  }

  // 第三阶段：热门地区优先，内部按 country_code 字母序；其余也按字母序；无归属地排最后
  result.sort((a, b) => {
    const ca = a.server ? countryMap.get(a.server) : null;
    const cb = b.server ? countryMap.get(b.server) : null;
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
