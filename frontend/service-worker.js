const CACHE_NAME = "hoursync-v3";

// Arquivos essenciais (APP SHELL)
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/shared/main.js",

  // Páginas — Admin
  "/dashboard_admin/dashboard_admin.html",
  "/dashboard_admin/dashboard_admin.js",
  "/gestao_cursos_admin/gestao_cursos_admin.html",
  "/gestao_cursos_admin/gestao_cursos_admin.js",
  "/certificados_admin/certificados_admin.html",
  "/certificados_admin/certificados.js",
  "/configuracoes_admin/configuracoes_admin.html",
  "/configuracoes_admin/configuracoes.js",
  "/coordenadores_admin/coordenadores_admin.html",
  "/coordenadores_admin/coordenadores_admin.js",

  // Páginas — Coordenador
  "/dashboard_coordenador/dashboard_coordenador.html",
  "/dashboard_coordenador/dashboard_coordenador.js",
  "/alunos_coordenador/alunos_coordenador.html",
  "/alunos_coordenador/alunos_coordenador.js",
  "/certificados_coordenador/certificados_coordenador.html",
  "/certificados_coordenador/certificados.js",
  "/configuracoes_coordenador/configuracoes_coordenador.html",
  "/configuracoes_coordenador/configuracoes.js",

  // Páginas — Autenticação
  "/login/login.html",
  "/login/login.js",
  "/senha/senha.html",
  "/senha/senha.js",
  "/cadastro/cadastro.html",
  "/cadastro/cadastro.js",

  // CSS global
  "/css/global.css",
  "/css/layout.css",
  "/css/components.css",
  "/css/darkmode.css",
  "/css/variables.css",

  // CSS por página
  "/css/pages/dashboard.css",
  "/css/pages/login.css",

  // Imagens
  "/img/logo.png",
  "/img/hoursync.png",
  "/img/icon48.png",
  "/img/icon72.png",
  "/img/icon96.png",
  "/img/icon144.png",
  "/img/icon192.png",
  "/img/icon512.png",
  "/img/circulo.png",
  "/img/esfera.png",
  "/img/esfera-azul.png",
  "/img/pontos.png",
  "/img/raio.png",
  "/img/tablete.png"
];

// INSTALAÇÃO (cache inicial)
self.addEventListener("install", (event) => {
  console.log("Service Worker: Instalando...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

// ATIVAÇÃO (limpa cache antigo)
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Ativado");

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Service Worker: Deletando cache antigo →", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// FETCH (estratégia: Cache First, com fallback para rede)
self.addEventListener("fetch", (event) => {
  // Ignora requisições que não sejam GET
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // Retorna do cache
      }

      return fetch(event.request)
        .then((res) => {
          // Só faz cache de respostas válidas
          if (!res || res.status !== 200 || res.type === "opaque") {
            return res;
          }

          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, res.clone());
            return res;
          });
        })
        .catch(() => {
          // Fallback offline para navegação
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});