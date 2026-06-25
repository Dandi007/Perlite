# Perlite 部署

读写都只读 vault，经 reverse proxy + gate-auth 暴露 `notes.qinglinzhang.top`。两套宿主：

| 宿主 | 进程管理 | 配置 | vault 数据源 | 监听 |
|---|---|---|---|---|
| macmini-sh (macOS) | tmuxsvc `svc`（agent-shell；遗留，迁移完可退役） | native `nginx/perlite.conf` + php-fpm | iCloud live 目录软链（实时直读） | `127.0.0.1:8088` + tailnet-expose 桥 100.64.0.3 |
| e300-nuc (Ubuntu) | **Docker Compose** | `docker-compose.nuc.yml`（build 镜像，env 无关，settings 烘入） | git clone `/data/vault`（`git pull` 刷新） | `100.64.0.6:8088` + `127.0.0.1:8088` |

ECS edge-gateway Caddy `import gated <tailnet-ip>:8088` 指向其一即为 live；切换只改该行。

## NUC (e300-nuc) Docker 部署

```bash
# 0. 一次性：装 docker（官方源），加 uther 进 docker 组
# 1. 取本仓库（fork）+ vault 数据源
gh repo clone Dandi007/Perlite /data/services/perlite
gh repo clone Dandi007/ObsidianZettelkasten /data/vault -- --depth 1 --branch master

# 2. 起容器（build 带 patch 的镜像 + 服务 vault 快照）
cd /data/services/perlite
docker compose -f docker-compose.nuc.yml up -d --build

# 3. 验证
curl -sI http://127.0.0.1:8088/ | head -1     # 期望 200
```

镜像 `perlite-zettelkasten:local` 由 `perlite/Dockerfile` 构建，含本地 patch（vault-search 语义检索接入、PWA 修复）+ 烘入 `settings.php`（`$rootDir=notes` / `$index=WIKI` / `$siteTitle=Zettelkasten`）。

> 注：`helper.php` 的语义检索打 `127.0.0.1:18082`（vault-search，Mac 本机服务）。容器内不可达 → 自动回落字面搜索。NUC 上要语义检索需另迁 vault-search 或改指向其 tailnet 地址。

## vault 刷新（内容新鲜度）

NUC 服务 vault 的 git 快照，非 iCloud live。刷新：

```bash
git -C /data/vault pull --ff-only    # 手动；可挂 cron / push 后 webhook
```
