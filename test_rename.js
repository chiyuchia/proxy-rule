/**
 * rename.js 本地测试脚本
 *
 * 用法:
 *   node test_rename.js [数量] [--remove] [--one] [--block=屏蔽词] [--token=TOKEN] [--retain=关键词]
 *
 * 参数:
 *   数量                    测试前 N 个节点，默认 3；传 all 则处理全部节点
 *   --remove                开启 remove=true，删除原节点名
 *   --one                   开启 one=true，去掉只有一个节点的地区的序号
 *   --filter=词1|词2|词3    过滤词，节点名匹配则直接丢弃
 *   --block=词1|词2|词3     屏蔽词，多个用 | 连接，匹配前从节点名中去除，不影响输出原名
 *   --token=TOKEN           IPinfo API Token，不传则使用免费 API（有限速）
 *   --hot                   只保留热门地区节点（HK/TW/CN/JP/SG/US）
 *   --hot=HK|SG|JP          只保留指定地区节点
 *   --retain=city           remove=true 时保留城市关键词（东京、悉尼等）
 *   --retain=city|IPLC      保留城市关键词 + 自定义关键词
 *
 * 示例:
 *   node test_rename.js                                    # 测试前 3 个节点，保留原名
 *   node test_rename.js 10                                 # 测试前 10 个节点
 *   node test_rename.js all                                # 全量处理，输出 data_tagged.json
 *   node test_rename.js 5 --remove                        # 测试前 5 个节点，删除原名
 *   node test_rename.js all --remove                      # 全量处理并删除原名
 *   node test_rename.js 5 --one                           # 单节点地区去掉序号
 *   node test_rename.js 5 --remove --one                  # 删除原名 + 去掉单节点序号
 *   node test_rename.js 5 "--block=TG:LSMOO|公益"          # 去除屏蔽词后再匹配
 *   node test_rename.js all --remove "--block=TG:LSMOO"   # 组合使用
 *   node test_rename.js 5 --token=b12d0e0992205d          # 指定 IPinfo token
 *   node test_rename.js 5 --remove "--retain=city"        # 删除原名 + 保留城市关键词
 *   node test_rename.js 5 --remove "--retain=city|IPLC"   # 删除原名 + 保留城市 + 自定义词
 *   node test_rename.js all --remove --one "--block=TG:LSMOO" --token=b12d0e0992205d "--retain=city"  # 全参数组合

 */

const fs = require("fs");

// 模拟 Sub-Store 运行环境
const cacheStore = {};
global.$cache = {
  get: (key) => cacheStore[key],
  set: (key, val) => {
    cacheStore[key] = val;
  },
};

const args = process.argv.slice(2);
const removeOriginalName = args.includes("--remove");
const one = args.includes("--one");
const hotArg = args.find((a) => a === "--hot" || a.startsWith("--hot="));
const hot = hotArg ? (hotArg.includes("=") ? hotArg.slice(6) : "1") : undefined;
const countArg = args.find(
  (a) =>
    a !== "--remove" &&
    a !== "--one" &&
    a !== "--hot" &&
    !a.startsWith("--hot=") &&
    !a.startsWith("--filter=") &&
    !a.startsWith("--block=") &&
    !a.startsWith("--token=") &&
    !a.startsWith("--retain="),
);

const filterWordsArg = args.find((a) => a.startsWith("--filter="));
const filterWords = filterWordsArg ? filterWordsArg.slice(9) : undefined;

const blockWordsArg = args.find((a) => a.startsWith("--block="));
const blockWords = blockWordsArg ? blockWordsArg.slice(8) : undefined;

const tokenArg = args.find((a) => a.startsWith("--token="));
const token = tokenArg ? tokenArg.slice(8) : undefined;

const retainArg = args.find((a) => a.startsWith("--retain="));
const retain = retainArg ? retainArg.slice(9) : undefined;

global.$arguments = {
  ...(removeOriginalName ? { remove: "1" } : {}),
  ...(one ? { one: "1" } : {}),
  ...(hot !== undefined ? { hot } : {}),
  ...(filterWords ? { filter: filterWords } : {}),
  ...(blockWords ? { block: blockWords } : {}),
  ...(token ? { token } : {}),
  ...(retain !== undefined ? { retain } : {}),
};

eval(fs.readFileSync("rename.js", "utf8"));

const all = JSON.parse(fs.readFileSync("data.json", "utf8"));
const proxies =
  countArg === "all" ? all : all.slice(0, parseInt(countArg) || 3);

console.log(
  `--- 输入节点 (${proxies.length} 个，remove=${removeOriginalName}) ---`,
);
proxies.forEach((p) => console.log(`  ${p.name} | ${p.server}`));
console.log("");

operator(proxies)
  .then((result) => {
    console.log("");
    console.log(`--- 输出节点 (${result.length} 个) ---`);
    result.forEach((p) => console.log(`  ${p.name}`));

    const renamed = result.filter(
      (p) => p.name !== all.find((o) => o.server === p.server)?.name,
    ).length;
    console.log(`\n重命名成功: ${renamed}/${result.length}`);

    if (countArg === "all") {
      fs.writeFileSync("data_tagged.json", JSON.stringify(result, null, 2));
      console.log("已写入 data_tagged.json");
    }
  })
  .catch((e) => console.error("运行出错:", e));
