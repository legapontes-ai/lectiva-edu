import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTEGIDAS = ["/painel", "/aluno"];
const INATIVIDADE_MIN = Number(process.env.SESSION_INACTIVITY_MINUTES ?? 30);
const COOKIE_ATIVIDADE = "lectiva-la";

/**
 * Proxy (antigo middleware). Atualiza a sessão do Supabase a cada request,
 * protege as áreas restritas e aplica expiração por inatividade.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const protegida = PROTEGIDAS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (protegida && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (protegida && user) {
    // Expiração por inatividade
    const la = request.cookies.get(COOKIE_ATIVIDADE)?.value;
    const agora = Date.now();
    if (la && agora - Number(la) > INATIVIDADE_MIN * 60_000) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("motivo", "inatividade");
      const out = NextResponse.redirect(url);
      for (const c of request.cookies.getAll()) {
        if (c.name.startsWith("sb-")) out.cookies.delete(c.name);
      }
      out.cookies.delete(COOKIE_ATIVIDADE);
      return out;
    }
    response.cookies.set(COOKIE_ATIVIDADE, String(agora), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Todas as rotas, exceto assets estáticos e arquivos com extensão.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
