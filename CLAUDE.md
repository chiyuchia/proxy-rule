# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 仓库概述

这是一个 Clash 代理配置仓库，用于管理基于规则的流量路由。主配置文件是 [clash_config.ini](clash_config.ini)，定义了各种服务和平台的规则集和代理组。

## 核心配置文件

**[clash_config.ini](clash_config.ini)** - 主 Clash 配置文件，使用 INI 格式和自定义语法：
- `ruleset=<策略组>,<规则集URL>` - 定义流量路由规则
- `custom_proxy_group=<组名>`select`<选项>` - 定义代理选择组
- 代理组定义中使用反引号 (`) 作为分隔符

## CDN 配置

所有 GitHub raw 内容 URL 使用 JSDMirror CDN 以提升国内访问速度：

**格式转换：**
```
https://raw.githubusercontent.com/{user}/{repo}/{branch}/{path}
→ https://cdn.jsdmirror.com/gh/{user}/{repo}/{branch}/{path}
```

**JSDMirror 特性：**
- 免费服务，流量无限制
- 单 IP 限制 300 QPS（超过 570 会限速）
- 被动缓存，自动从 jsDelivr 回源
- GitHub 更改后几分钟内自动同步

## Clash 规则优先级

**关键：** Clash 规则从上到下依次匹配，第一条匹配的规则生效。

**规则排序原则：**
1. 更具体的规则必须放在通用规则之前
2. 示例：YouTube 规则必须放在 Google 规则之前（否则 YouTube 域名会被 Google 规则匹配）

**正确顺序：**
```ini
ruleset=📹 油管视频,YouTube.list
ruleset=📢 谷歌服务,Google.list
```

**错误顺序（YouTube 流量会被 Google 规则捕获）：**
```ini
ruleset=📢 谷歌服务,Google.list
ruleset=📹 油管视频,YouTube.list
```

## 配置结构

[clash_config.ini](clash_config.ini) 按以下部分组织：

1. **局域网和直连规则** - LAN 和直连规则
2. **特定平台规则** - 平台特定规则（媒体、AI、游戏、IM）
3. **企业服务规则** - 企业服务（Apple、Microsoft、Google）
4. **大类服务规则** - 大类服务分类
5. **代理节点规则** - 代理节点规则
6. **最终规则** - 最终兜底规则

代理组包括：
- 核心组：节点选择、手动切换、自动选择
- 机场订阅组：Dler Cloud、肯の机、V2Tun、一元机场
- 地区节点组：香港、美国、狮城、日本、台湾、韩国
- 服务分流组：与每个规则集对应

## Git 工作流

**分支策略：**
- `master` - 稳定生产分支
- `test` - 开发分支（推荐日常工作使用）
- 功能分支 - 仅用于大型功能

**开发流程：**
1. 在 `test` 分支上进行开发
2. 合并前充分测试
3. 仅在稳定时合并到 `master`
4. 推送是提交后的独立手动步骤

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

**格式：** `<type>(<scope>): <subject>`

**类型：**
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更新
- `style` - 代码格式调整
- `refactor` - 重构
- `perf` - 性能优化
- `test` - 测试相关
- `chore` - 构建/工具变动
- `ci` - CI 配置

**常用范围：**
- `clash-rules` - Clash 规则配置
- `clash-config` - Clash 配置文件
- `cdn` - CDN 配置
- `docs` - 文档

**示例：**
```bash
git commit -m "feat(clash-config): 为所有服务分流组添加机场订阅选项"
```

## 文件结构

```
proxy-rule/
├── clash_config.ini      # 主 Clash 配置文件
├── CONTRIBUTING.md       # 开发指南（中文）
├── temp/                 # 临时/备份配置
└── .trae/               # 工具配置
```
