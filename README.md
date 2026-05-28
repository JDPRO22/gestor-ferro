# ⚙️ Gestor de Ferro — Sistema do Rogério

App PWA mobile-first para controle financeiro de serralheiros.

## 📁 Arquivos

```
gestor-ferro/
├── index.html      ← Estrutura da página
├── style.css       ← Visual dark mode
├── app.js          ← Toda a lógica
├── manifest.json   ← PWA (instalar no celular)
├── sw.js           ← Funciona offline
├── icon-192.svg    ← Ícone do app
└── icon-512.svg    ← Ícone grande
```

## 🚀 Como hospedar (grátis, 2 minutos)

### Opção 1 — Netlify (mais fácil)
1. Acesse https://netlify.com e crie conta grátis
2. Arraste a PASTA `gestor-ferro` para o painel
3. Pronto. Link gerado automaticamente.

### Opção 2 — Vercel
1. Acesse https://vercel.com
2. Clique em "Add New > Project"
3. Faça upload da pasta ou conecte ao GitHub
4. Deploy automático.

### Opção 3 — GitHub Pages
1. Crie repositório no GitHub
2. Suba todos os arquivos
3. Settings > Pages > Deploy from main branch

## 📲 Como o Rogério instala no celular

Depois de hospedar:
1. Abrir o link no **Chrome** (Android) ou **Safari** (iPhone)
2. Android: Menu ⋮ → "Adicionar à tela inicial"
3. iPhone: Botão compartilhar → "Adicionar à Tela de Início"
4. O app aparece como ícone, igual a um app de verdade

## 🔒 Dados

Todos os dados ficam no localStorage do celular do Rogério.
Nenhum servidor, nenhum banco de dados, zero custo.

## ✅ Funcionalidades

- Dashboard com saldo e teto diário de gasto pessoal
- Gerador de orçamento com split 50/50 automático
- Texto pronto para WhatsApp com 1 clique
- Alerta visual quando ultrapassa limite de gasto pessoal
- Scripts prontos de cobrança
- Relatório de margem por obra
- Zona de risco com alertas automáticos
- Funciona offline (service worker)
- Instalável como PWA
