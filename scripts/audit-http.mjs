const base = "http://localhost:3000";

async function login(email, password) {
  const jar = new Map();
  function store(res) {
    const cookies = typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
    for (const c of cookies) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      if (i > 0) jar.set(pair.slice(0, i), pair.slice(i + 1));
    }
  }
  function cookieHeader() {
    return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  const csrfRes = await fetch(`${base}/api/auth/csrf`);
  store(csrfRes);
  const { csrfToken } = await csrfRes.json();
  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    json: "true",
    redirect: "false",
  });
  const loginRes = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(),
    },
    body,
    redirect: "manual",
  });
  store(loginRes);
  return cookieHeader();
}

async function hit(path, cookie) {
  const res = await fetch(base + path, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "manual",
  });
  const loc = res.headers.get("location") || "";
  let snippet = "";
  if (res.status >= 400) {
    const text = await res.text();
    const m = text.match(/"message":"([^"]+)"/);
    snippet = m ? m[1] : text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 180);
  }
  return { path, status: res.status, loc, snippet };
}

const publicPaths = [
  "/",
  "/planos",
  "/loja",
  "/loja/camisa-torcedor-2026",
  "/loja/garrafa-termica-taquaralto",
  "/loja/carrinho",
  "/loja/checkout",
  "/login",
  "/cadastro",
  "/ingressos/cmul8shdm000ri6e05c9c72hp",
  "/ingressos/cmul8shdm000pi6e05w8ew6ii",
  "/ingressos/cmul8shdm000qi6e0osmlcswr",
  "/api/auth/session",
  "/api/auth/csrf",
  "/api/plans",
];

const memberPaths = [
  "/area",
  "/area/cadastro",
  "/area/pagamentos",
  "/area/ingressos",
  "/area/pedidos",
  "/area/beneficios",
  "/area/carteirinha",
  "/loja/checkout",
];

const adminPaths = [
  "/admin",
  "/admin/socios",
  "/admin/pagamentos",
  "/admin/jogos",
  "/admin/loja",
  "/admin/loja/produtos",
  "/admin/loja/cadastrar",
  "/admin/loja/estoque",
  "/admin/loja/compras",
  "/admin/loja/pagamentos",
  "/admin/planos",
  "/admin/config",
];

const pub = [];
for (const p of publicPaths) pub.push(await hit(p));

const memberCookie = await login("socio@demo.com", "socio123");
const member = [];
for (const p of memberPaths) member.push(await hit(p, memberCookie));

const adminCookie = await login("admin@taquaraltofutsal.com.br", "admin123");
const admin = [];
for (const p of adminPaths) admin.push(await hit(p, adminCookie));

const bad = [...pub, ...member, ...admin].filter(
  (r) => r.status >= 400 || (r.status >= 300 && r.status < 400 && r.loc.includes("error"))
);
console.log(JSON.stringify({ bad, pub, member, admin }, null, 2));
