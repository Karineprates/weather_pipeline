import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo"; // 👈 importe aqui
import { NavLink } from "react-router-dom";

export function AppShell({
  children,
  userEmail,
  userRole,
  onLogout,
}: {
  children: ReactNode;
  userEmail?: string;
  userRole?: string;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* NAVBAR */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <Logo />

            <div>
              <p className="text-sm font-semibold">
                Weather Intelligence
              </p>
              <p className="text-xs text-muted-foreground">
                Monitoramento Climático
              </p>
            </div>
          </div>

          {/* RIGHT AREA */}
          <div className="flex items-center gap-4 text-xs md:text-sm">
            <ThemeToggle />

            {userEmail && (
              <div className="hidden text-right md:block">
                <p className="font-medium">Logado como</p>
                <p className="text-muted-foreground">{userEmail}</p>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={onLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 space-y-8">
        <nav className="flex flex-wrap gap-3 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-full border px-3 py-1 ${isActive ? "bg-primary text-primary-foreground" : ""}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/weather"
            className={({ isActive }) =>
              `rounded-full border px-3 py-1 ${isActive ? "bg-primary text-primary-foreground" : ""}`
            }
          >
            Histórico
          </NavLink>

          {userRole === "admin" && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `rounded-full border px-3 py-1 ${isActive ? "bg-primary text-primary-foreground" : ""}`
              }
            >
              Usuários
            </NavLink>
          )}

          <NavLink
            to="/explorar"
            className={({ isActive }) =>
              `rounded-full border px-3 py-1 ${isActive ? "bg-primary text-primary-foreground" : ""}`
            }
          >
            Explorar API Pública
          </NavLink>
        </nav>

        {children}
      </main>
    </div>
  );
}
