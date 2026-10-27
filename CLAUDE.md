# Projeto: site pessoal + marketplace de plugins (piazambuja.github.io)

Site pessoal do Piero Azambuja (Especialista em SRE) e marketplace público de plugins para o Claude Code, no mesmo repositório e publicados no GitHub Pages.

## Como funciona

- `node build.mjs` gera o site em `dist/`. Não há dependências npm, por escolha: o build roda em qualquer lugar e no CI sem instalar nada.
- `node scripts/validate.mjs` valida o marketplace. Rode também `claude plugin validate .` depois de mexer em plugins.
- `npm run dev` gera o site e serve em http://localhost:4321.
- Conteúdo da home: `content/profile.json`. Catálogo: lido de `.claude-plugin/marketplace.json` e de `plugins/*/` (plugin.json + skills/*/SKILL.md + README.md).
- Deploy: `.github/workflows/deploy.yml` valida, gera e publica a cada push na `main`.

## Direção de design atual

Conceito: o site é um painel de monitoramento. O único elemento ousado é o gráfico da home, em que a carreira aparece como uma série com anotações de deploy (2012 a 2026). O resto é sóbrio e disciplinado.

Tokens (em `static/style.css`, `:root`, com versão escura em `prefers-color-scheme`):
- `--paper` #E8EDF0 (fundo papel milimetrado), `--panel` #F5F8F9, `--ink` #15232E, `--ink-2` #4B5D69
- `--grid` #C7D1D8 (linhas finas), `--signal` #1D6F66 (série saudável e links), `--note` #B57C00 (anotações)
- Fontes: Schibsted Grotesk (tudo) + JetBrains Mono (só comandos e código)

Layout: seções em duas colunas no desktop (título fixo à esquerda, conteúdo à direita) e uma coluna no celular. Plugins aparecem como linhas de tabela, não como cards.

Evitar: cards iguais com sombra, rótulos em CAIXA ALTA acima de títulos, numeração 01/02/03 em conteúdo que não é sequência, gradientes decorativos, animações de entrada em cada seção (a única animação é o desenho do gráfico, e ela respeita `prefers-reduced-motion`).

Padrão mínimo: sem rolagem horizontal em 390px, foco visível no teclado, contraste AA nos dois temas.

## Ao revisar o visual

Gere o site e tire screenshots em 1280px e 390px, nos modos claro e escuro, antes de dar uma mudança por concluída.

## Pendências conhecidas

- `links.linkedin` vazio em `content/profile.json`.
- As descrições dos cargos System Engineer e Senior System Engineer são genéricas e precisam do texto do Piero.
- Skills em inglês; site em português.
