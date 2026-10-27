# Piero Azambuja: site pessoal + marketplace de plugins

Este repositório é duas coisas ao mesmo tempo:

1. **Um marketplace de plugins para o Claude Code** (`.claude-plugin/marketplace.json` + `plugins/`).
2. **Meu site pessoal no GitHub Pages**, gerado a partir do mesmo conteúdo: a página de cada plugin é montada lendo os `plugin.json` e `SKILL.md`, então o catálogo nunca fica desatualizado.

## Usar os plugins

No Claude Code:

```
/plugin marketplace add <usuario>/<repo>
/plugin install k8s-troubleshooting@piero-sre
```

| Plugin | O que traz |
| --- | --- |
| `k8s-troubleshooting` | Skills `k8s-triage` e `resource-rightsizing` |
| `observability` | Skills `slo-design`, `promql` e `alert-review` |
| `incident-response` | Skills `incident-commander` e `postmortem` |
| `aws-finops` | Skill `aws-cost-review` |
| `ai-platform` | Skills `llm-gateway-design`, `mcp-server-review` e `skill-authoring` |
| `career` | Skill `linkedin-profile`: auditoria e reescrita do perfil do LinkedIn para recrutadores |
| `prod-guardrails` | Hook `PreToolUse` que pede confirmação antes de comandos destrutivos em produção |

## Estrutura

```
.claude-plugin/marketplace.json   catálogo lido pelo Claude Code
plugins/<plugin>/                 cada plugin (manifesto, skills, hooks)
content/profile.json              textos do site pessoal
build.mjs                         gerador do site (Node, sem dependências)
lib/markdown.mjs                  renderizador de Markdown usado no build
static/                           CSS, JS e favicon
scripts/validate.mjs              validação do marketplace (roda no CI)
.github/workflows/deploy.yml      build + deploy no GitHub Pages
```

## Publicar

1. Crie o repositório. Se o nome for `<usuario>.github.io`, o site fica em `https://<usuario>.github.io/`; com outro nome, fica em `https://<usuario>.github.io/<repo>/`. O build detecta isso sozinho.
2. Suba os arquivos na branch `main`.
3. Em **Settings → Pages**, escolha **Source: GitHub Actions**.
4. Cada push na `main` valida o marketplace, gera o site e publica.

## Rodar localmente

Requer Node 18+.

```bash
npm run validate    # confere manifestos, nomes e frontmatter das skills
npm run dev         # gera dist/ e serve em http://localhost:4321
```

Para os comandos de instalação aparecerem com o seu usuário no build local:

```bash
GITHUB_REPOSITORY=<usuario>/<repo> node build.mjs
```

## Adicionar um plugin

1. Crie `plugins/<nome>/.claude-plugin/plugin.json` com `name` e `description`.
2. Adicione skills em `plugins/<nome>/skills/<skill>/SKILL.md` (frontmatter com `name` e `description`).
3. Adicione a entrada em `.claude-plugin/marketplace.json`.
4. `npm run validate`. Se tiver o Claude Code instalado, rode também `claude plugin validate .`.

Os plugins não fixam `version`, então cada commit vira uma versão nova para quem rodar `/plugin marketplace update piero-sre`.

## Licença

MIT
