# 🎓 HourSync — Frontend

> Sistema de Gestão de Atividades Complementares da Faculdade Senac Pernambuco

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap&logoColor=white)](https://getbootstrap.com)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

---

## 📋 Sobre o Projeto

O **HourSync** é uma plataforma web desenvolvida como Projeto Integrador do curso de Análise e Desenvolvimento de Sistemas (3° período) da Faculdade Senac Pernambuco. O frontend é uma **PWA (Progressive Web App)** construída com HTML, CSS e JavaScript puro, integrada ao backend via API REST.

### O que o sistema faz
- **Alunos** submetem certificados de atividades complementares
- **Coordenadores** validam e aprovam/rejeitam certificados do seu curso
- **Administradores** gerenciam cursos, coordenadores, alunos e acompanham métricas

---

## 🌐 URL do Backend (API)

```
https://backendhoursync-1.onrender.com/api
```

> ⚠️ O plano gratuito do Render hiberna após inatividade. A primeira requisição pode demorar até 50 segundos.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Função |
|---|---|
| **HTML5** | Estrutura das páginas |
| **CSS3** | Estilização e responsividade |
| **JavaScript (ES6+)** | Lógica e integração com a API |
| **Bootstrap 5.3** | Componentes de interface |
| **Bootstrap Icons** | Ícones |
| **Service Worker** | Cache offline (PWA) |
| **Web App Manifest** | Instalação como app nativo |
| **localStorage** | Armazenamento do token e dados do usuário |

---

## 📁 Estrutura do Projeto

```
frontendHourSync/
│
├── shared/
│   ├── api.js          → Camada de integração com o backend (todos os fetch)
│   ├── config.js       → URL do backend — altere aqui para trocar o ambiente
│   └── main.js         → Lógica compartilhada entre todas as páginas
│
├── css/
│   ├── variables.css   → Variáveis CSS (cores, fontes, espaçamentos)
│   ├── global.css      → Estilos globais aplicados em todas as páginas
│   ├── layout.css      → Layout da sidebar e estrutura principal
│   ├── components.css  → Componentes reutilizáveis (cards, tabelas, badges)
│   ├── darkmode.css    → Estilos do modo escuro
│   └── pages/
│       ├── login.css   → Estilos da tela de login
│       └── dashboard.css → Estilos dos dashboards
│
├── login/
│   ├── login.html      → Tela de login
│   └── login.js        → Autenticação e redirecionamento por role
│
├── senha/
│   ├── senha.html      → Tela de recuperação de senha
│   └── senha.js        → Fluxo de reset de senha
│
├── dashboard_admin/
│   ├── dashboard_admin.html  → Dashboard do Super Admin
│   └── dashboard_admin.js   → Métricas gerais do sistema
│
├── gestao_cursos_admin/
│   ├── gestao_cursos_admin.html → Gestão de cursos e categorias
│   └── gestao_cursos_admin.js  → CRUD de cursos
│
├── coordenadores_admin/
│   ├── coordenadores_admin.html → Gestão de coordenadores
│   └── coordenadores_admin.js  → CRUD de coordenadores
│
├── alunos_admin/
│   ├── alunos_admin.html → Gestão de alunos (visão admin)
│   └── alunos_admin.js  → Listagem e gerenciamento de alunos
│
├── certificados_admin/
│   ├── certificados_admin.html → Visão geral de certificados (admin)
│   └── certificados.js         → Listagem e filtros de certificados
│
├── configuracoes_admin/
│   ├── configuracoes_admin.html → Configurações do perfil (admin)
│   └── configuracoes.js         → Atualização de perfil
│
├── dashboard_coordenador/
│   ├── dashboard_coordenador.html → Dashboard do Coordenador
│   └── dashboard_coordenador.js  → Métricas do curso
│
├── alunos_coordenador/
│   ├── alunos_coordenador.html → Alunos do curso (visão coordenador)
│   └── alunos_coordenador.js  → Progresso dos alunos
│
├── certificados_coordenador/
│   ├── certificados_coordenador.html → Certificados para validação
│   └── certificados.js               → Aprovar/rejeitar certificados
│
├── configuracoes_coordenador/
│   ├── configuracoes_coordenador.html → Configurações do perfil (coordenador)
│   └── configuracoes.js               → Atualização de perfil
│
├── img/                → Imagens e ícones do sistema
├── index.html          → Página de entrada (redireciona conforme login)
├── manifest.json       → Configuração PWA (ícones, nome, cor)
└── service-worker.js   → Cache offline para PWA
```

---

## 🔐 Autenticação e Perfis

O sistema possui três perfis de acesso, cada um com suas próprias telas:

| Role | Telas disponíveis |
|---|---|
| `SUPER_ADMIN` | Dashboard Admin, Gestão de Cursos, Coordenadores, Alunos, Certificados, Configurações |
| `COORDENADOR` | Dashboard Coordenador, Alunos do Curso, Certificados para Validação, Configurações |
| `ALUNO` | Dashboard Aluno, Submissão de Certificados, Configurações |

### Fluxo de autenticação
1. Usuário acessa `/login/login.html`
2. Digita email e senha
3. Frontend chama `POST /api/auth/login`
4. Backend retorna `{ token, usuario: { id, nome, email, role } }`
5. Token e dados são salvos no `localStorage`
6. Redirecionamento automático para o dashboard correto

---

## 🔌 Integração com o Backend (api.js)

Toda comunicação com o backend passa pelo arquivo `shared/api.js`. Ele centraliza todos os `fetch` e gerencia automaticamente:

- Envio do token JWT no header `Authorization: Bearer TOKEN`
- Redirecionamento para o login quando o token expira (status 401)
- Remoção do `Content-Type` para uploads de arquivo (FormData)
- Tratamento de erros de rede

### Objetos disponíveis globalmente

```javascript
// Autenticação
Auth.login(email, senha)        // Faz login e salva no localStorage
Auth.logout()                   // Limpa localStorage e redireciona
Auth.getUsuario()               // Retorna dados do usuário logado
Auth.getRole()                  // Retorna a role do usuário (SUPER_ADMIN, COORDENADOR, ALUNO)
Auth.isLogado()                 // true/false
Auth.resetSenha(email, senha)   // Reset de senha

// Usuários
Usuarios.listar()
Usuarios.buscarPorId(id)
Usuarios.listarCoordenadores()
Usuarios.listarAlunos()
Usuarios.criar(dados)
Usuarios.ativarInativar(id, ativo)
Usuarios.remover(id)

// Cursos
Cursos.listar()
Cursos.buscarPorId(id)
Cursos.criar(dados)
Cursos.remover(id)

// Categorias
Categorias.listar()
Categorias.listarPorCurso(cursoId)
Categorias.criar(dados)
Categorias.remover(id)

// Certificados
Certificados.listar()
Certificados.buscarPorId(id)
Certificados.listarPorAluno(alunoId)
Certificados.listarPorCurso(cursoId)
Certificados.listarPorStatus(status)   // "PENDENTE" | "APROVADO" | "REJEITADO"
Certificados.submeter(dados)
Certificados.validar(certId, status, coordenadorId, motivo)

// Upload
Upload.enviar(arquivo)   // Recebe File, retorna URL do arquivo

// Dashboard
Dashboard.admin()
Dashboard.coordenador(cursoId)

// Progresso
Progresso.porAluno(alunoId)
Progresso.porCurso(cursoId)
Progresso.calculo(certId)

// Helpers de UI
showToast(mensagem, tipo)   // tipo: "success" | "danger" | "warning" | "info"
setLoading(btnEl, loading)  // Spinner em botões durante chamadas async
```

---

## ⚙️ Como Trocar a URL do Backend

Abra o arquivo `shared/config.js` e altere apenas essa linha:

```javascript
// Desenvolvimento local
window.HOURSYNC_API = "http://localhost:3000/api";

// Produção (Render)
window.HOURSYNC_API = "https://backendhoursync-1.onrender.com/api";
```

**Não precisa alterar nenhum outro arquivo** — todos os `fetch` do projeto leem essa variável automaticamente.

---

## 📱 PWA — Progressive Web App

O HourSync é uma PWA, o que significa que pode ser instalado como um aplicativo nativo no celular ou computador.

### Funcionalidades PWA
- **Instalável** — aparece o botão "Instalar" no navegador
- **Ícones** — ícones em múltiplos tamanhos para diferentes dispositivos (48px até 512px)
- **Cache offline** — o Service Worker armazena os arquivos principais em cache, permitindo navegação mesmo sem internet
- **Tela cheia** — quando instalado, abre sem barra de endereço (`display: standalone`)

### manifest.json
```json
{
  "name": "HourSync - Gestão de Horas",
  "short_name": "HourSync",
  "display": "standalone",
  "start_url": "/index.html",
  "background_color": "#080808",
  "theme_color": "#ea580c",
  "lang": "pt-BR"
}
```

### Service Worker
O `service-worker.js` implementa a estratégia **Cache First** para os assets estáticos:
1. Na primeira visita, baixa e armazena todos os arquivos HTML, CSS e JS no cache
2. Nas visitas seguintes, carrega do cache (mais rápido e funciona offline)
3. Cache nomeado `hoursync-v3` — ao atualizar o projeto, basta incrementar a versão

---

## 🎨 Sistema de Estilos

O CSS está organizado em camadas de responsabilidade:

| Arquivo | Responsabilidade |
|---|---|
| `variables.css` | Define todas as cores, fontes e tamanhos como variáveis CSS |
| `global.css` | Reset e estilos base aplicados em todo o projeto |
| `layout.css` | Sidebar, topbar e estrutura principal das páginas |
| `components.css` | Cards, tabelas, badges, modais e outros componentes |
| `darkmode.css` | Override de cores para o modo escuro |
| `pages/login.css` | Estilos específicos da tela de login |
| `pages/dashboard.css` | Estilos específicos dos dashboards |

---

## 🚀 Como Visualizar o Projeto

O frontend é HTML puro — não precisa instalar Node.js nem nenhuma dependência. Mas **não pode ser aberto clicando direto no arquivo**, pois o `fetch` não funciona com o protocolo `file://`.

### Opção 1 — VS Code com Live Server (recomendado)
1. Instale a extensão **Live Server** no VS Code
2. Clique com botão direito em `index.html`
3. Selecione **Open with Live Server**
4. Acessa em `http://localhost:5500`

### Opção 2 — Terminal
```bash
npx serve .
```
Acessa em `http://localhost:3000`

---

## 📦 Como Fazer o Deploy no GitHub Pages

1. Suba o código no GitHub:
```bash
git init
git add .
git commit -m "hoursync frontend"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/frontendHourSync.git
git push -u origin main
```

2. No GitHub, acesse o repositório → **Settings → Pages**
3. Em **Source**, selecione **main** e pasta **/ (root)**
4. Clique em **Save**
5. Aguarde alguns minutos — a URL vai aparecer:
```
https://SEU_USUARIO.github.io/frontendHourSync
```

> ⚠️ Após o deploy no GitHub Pages, certifique-se de que o `shared/config.js` está apontando para a URL de produção do backend.

---

## 👥 Equipe

| Nome |
|---|
| Arthur Vinicius |
| Marcos Vinicius |
| Thauan Bezerra |
| Caio Sabino |
| José Allamberg |
| Pedro Rodrigues |

**Instituição:** Faculdade Senac Pernambuco
**Curso:** Análise e Desenvolvimento de Sistemas — 3° Período
**Ano:** 2026

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos como Projeto Integrador da Faculdade Senac Pernambuco.
