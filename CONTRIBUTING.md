# 贡献指南

本文档说明了本项目的开发规范和约定。

---

## 开发流程

1. **修改代码**：在本地进行必要的修改
2. **验证更改**：确保修改正确可用
3. **手动提交**：使用约定式提交格式进行 `git commit`
4. **确认后推送**：检查 commit 信息无误后，手动执行 `git push`

> ⚠️ **重要**：提交和推送是两个独立的步骤，必须分别手动执行。

---

## 约定式提交

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

| Type | 说明 |
|-------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式调整（不影响功能） |
| `refactor` | 重构（非新功能、非 bug 修复） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建过程或辅助工具变动 |
| `ci` | CI 配置和脚本 |

### Scope 范围

描述提交影响的范围，例如：

- `clash-rules` - Clash 规则配置
- `cdn` - CDN 配置
- `docs` - 文档

### 示例

```bash
# 简单提交
git commit -m "feat(clash-rules): 合并谷歌相关规则集和策略组"

# 详细提交
git commit -m "perf(rules): 替换 raw.githubusercontent.com 为 JSDMirror CDN 链接

将所有 GitHub Raw 链接替换为 JSDMirror CDN 加速链接，提升国内访问速度。

- 替换 32 个 raw.githubusercontent.com 链接
- JSDMirror 提供免费的全球 CDN 加速服务
- 保持原有的规则集路径不变"
```

---

## CDN 配置

本项目使用 [JSDMirror](https://cdn.jsdmirror.com) CDN 加速 GitHub 资源访问。

### 链接格式

| 源格式 | CDN 格式 |
|---------|----------|
| `https://raw.githubusercontent.com/{user}/{repo}/{branch}/{path}` | `https://cdn.jsdmirror.com/gh/{user}/{repo}/{branch}/{path}` |

### JSDMirror 说明

- **价格**：免费
- **流量**：无限制
- **QPS**：单 IP 300 QPS，超过 570 会限速
- **同步**：自动从 jsDelivr 回源，无需手动操作

> 💡 JSDMirror 是被动缓存服务，提交到 GitHub 后会自动同步（通常需要几分钟）。

---

## Clash 规则配置

### 规则优先级

Clash 规则**从上到下依次匹配**，第一条匹配的规则生效。

### 修改原则

1. **具体规则在前**：更具体的规则（如 YouTube）应放在通用规则（如 Google）之前
2. **规则集命名**：使用清晰的中文名称（如 "📢 谷歌服务"）
3. **策略组统一**：相同用途的规则集应使用同一个策略组

### 示例

```ini
; 正确顺序：YouTube 优先于 Google
ruleset=📹 油管视频,YouTube.list
ruleset=📢 谷歌服务,Google.list

; 错误顺序：Google 会匹配 YouTube
ruleset=📢 谷歌服务,Google.list
ruleset=📹 油管视频,YouTube.list
```

---

## 项目结构

```
proxy-rule/
├── clash_config.ini      # Clash 配置文件
├── CONTRIBUTING.md       # 本文档
└── .trae/              # 相关工具配置
```

---

## 版本控制

- **分支策略**：使用 `master` 分支
- **提交前检查**：确认更改无误后再 commit
- **推送前确认**：检查 commit 信息正确后再 push

---

## 联系方式

如有问题，请提交 [Issue](https://github.com/chiyuchia/proxy-rule/issues)。
