# SAEP — Gerador de Provas Práticas SENAI

Ferramenta para professores dos Cursos Técnicos do SENAI criarem provas práticas diagnósticas no padrão **SAEP (Sistema de Avaliação da Educação Profissional)** usando Inteligência Artificial (Claude da Anthropic).

---

## 🌐 Configurar domínio personalizado (I7)

Para trocar a URL de `usuario.github.io/saep-gerador` para algo como `saep.senai-sc.org.br`:

### Passo 1 — Criar o arquivo CNAME no repositório
Crie um arquivo chamado `CNAME` (sem extensão) na raiz do repositório com o domínio desejado:
```
saep.senai-sc.org.br
```

### Passo 2 — Configurar o DNS
No painel do provedor de DNS do SENAI, adicione um registro:

| Tipo | Nome | Valor |
|------|------|-------|
| `CNAME` | `saep` | `SEU_USUARIO.github.io` |

> Se for um domínio raiz (sem subdomínio), use 4 registros `A` apontando para os IPs do GitHub Pages: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`

### Passo 3 — Ativar no GitHub Pages
Em **Settings → Pages**, o campo "Custom domain" será preenchido automaticamente pelo arquivo CNAME. Marque **"Enforce HTTPS"**.

> ⏱ A propagação DNS pode levar até 48h. O GitHub Pages emite o certificado SSL automaticamente.

---

## ✨ Funcionalidades

- Seleção entre **17 cursos técnicos** do SENAI
- Geração de provas em **3 níveis de dificuldade** (Fácil, Médio, Difícil)
- Suporte a **assets externos** via link do Google Drive
- Exportação em **PDF** (via impressão do navegador) ou **DOCX** (copia o texto)
- Chave de API salva **localmente no navegador** do professor (sem servidor)
- Interface responsiva, 100% estática — funciona no **GitHub Pages**

---

## 🚀 Como publicar no GitHub Pages

### Passo 1 — Crie um repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique em **New repository**
3. Dê um nome (ex: `saep-gerador-provas`)
4. Deixe como **Public**
5. Clique em **Create repository**

### Passo 2 — Faça o upload dos arquivos

**Opção A — Via interface web (mais simples):**

1. No repositório criado, clique em **uploading an existing file**
2. Arraste ou selecione **todos os arquivos e pastas** deste projeto:
   ```
   index.html
   favicon.svg
   .nojekyll
   css/
     style.css
   js/
     app.js
     courses.js
   ```
3. Clique em **Commit changes**

> ⚠️ **Atenção:** O arquivo `.nojekyll` pode ficar oculto no seu sistema operacional. Certifique-se de incluí-lo — ele é obrigatório para o GitHub Pages processar corretamente a pasta `css/`.

**Opção B — Via Git (linha de comando):**

```bash
git init
git add .
git commit -m "Primeiro commit — SAEP Gerador de Provas"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/saep-gerador-provas.git
git push -u origin main
```

### Passo 3 — Ative o GitHub Pages

1. No repositório, vá em **Settings** → **Pages**
2. Em **Source**, selecione **Deploy from a branch**
3. Em **Branch**, selecione `main` e a pasta `/ (root)`
4. Clique em **Save**
5. Aguarde ~1-2 minutos e acesse a URL exibida:
   ```
   https://SEU_USUARIO.github.io/saep-gerador-provas/
   ```

---

## 🔑 Chave de API (Anthropic Claude)

A ferramenta usa a API do Claude (Anthropic) para gerar as provas. **Cada professor precisa de sua própria chave.**

### Como obter uma chave:

1. Acesse [console.anthropic.com](https://console.anthropic.com)
2. Crie uma conta (ou faça login)
3. Vá em **Settings → API Keys**
4. Clique em **Create Key** e copie a chave gerada (começa com `sk-ant-...`)

### Como configurar na ferramenta:

1. Acesse o site no GitHub Pages
2. Clique no botão **⚙️ Configurações** no canto superior direito
3. Cole sua chave de API no campo indicado
4. Clique em **Salvar Chave**

> 🔒 **Segurança:** A chave é salva **apenas no navegador local** do professor via `localStorage`. Ela nunca é enviada a nenhum servidor além da própria API da Anthropic. Cada professor gerencia a sua própria chave.

### Custo estimado:

Cada geração de prova usa aproximadamente **2.000–4.000 tokens**. Com o plano gratuito da Anthropic você tem créditos para dezenas de provas. Consulte [anthropic.com/pricing](https://www.anthropic.com/pricing) para detalhes.

---

## 📁 Estrutura do projeto

```
saep-gerador-provas/
├── index.html          # Página principal
├── favicon.svg         # Ícone do site
├── .nojekyll           # Necessário para GitHub Pages
├── README.md           # Este arquivo
├── css/
│   └── style.css       # Estilos da interface
└── js/
    ├── courses.js      # Lista e dados dos cursos técnicos
    └── app.js          # Lógica da aplicação e integração com a IA
```

---

## 🛠️ Como adicionar ou editar cursos

Edite o arquivo `js/courses.js`. Cada curso tem este formato:

```javascript
{
  id:      'nome_unico_sem_espacos',
  name:    'Nome do Curso',
  area:    'Área Temática',
  icon:    'ti-nome-do-icone',   // Ícones: tabler-icons.io
  context: 'Descrição dos conteúdos e competências do curso...'
}
```

O campo `context` é enviado diretamente para a IA — quanto mais detalhado, melhor a qualidade da prova gerada.

---

## 🧱 Tecnologias utilizadas

| Tecnologia | Uso |
|---|---|
| HTML5 / CSS3 / JavaScript vanilla | Interface e lógica |
| [Barlow / Barlow Condensed](https://fonts.google.com/specimen/Barlow) | Tipografia |
| [Tabler Icons](https://tabler-icons.io) | Ícones |
| [Claude API — Anthropic](https://www.anthropic.com) | Geração de provas por IA |
| GitHub Pages | Hospedagem estática gratuita |

---

## ❓ Perguntas frequentes

**A prova gerada pode ser editada?**
Sim. Copie o texto gerado e cole no Word ou Google Docs para personalizar antes de imprimir.

**Preciso de servidor ou banco de dados?**
Não. O site é 100% estático e funciona no GitHub Pages sem nenhum backend.

**A IA pode errar ou inventar informações técnicas?**
Como toda IA, o Claude pode cometer imprecisões. Recomenda-se que o professor revise a prova gerada antes de aplicá-la.

**Posso usar o site com meus alunos?**
A ferramenta é voltada para professores criarem provas. Os alunos recebem a prova impressa ou em PDF, sem acesso à ferramenta.

---

## 📄 Licença

Desenvolvido para uso interno do SENAI. Distribua livremente entre docentes da instituição.
