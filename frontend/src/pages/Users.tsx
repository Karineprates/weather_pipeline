import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ManagedUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export default function UsersPage() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedUser | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  // ----------------------------------------------------------
  // 🔄 Carregar lista de usuários (somente admin)
  // ----------------------------------------------------------
  useEffect(() => {
    if (!user || user.role !== "admin") return;

    api
      .get<ManagedUser[]>("/users")
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  }, [user]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: "user" });
    setOpen(true);
  }

  function openEdit(target: ManagedUser) {
    setEditing(target);
    setForm({
      name: target.name,
      email: target.email,
      password: "",
      role: target.role,
    });
    setOpen(true);
  }

  // ----------------------------------------------------------
  // 💾 Criar ou editar usuário
  // ----------------------------------------------------------
  async function saveUser() {
    interface UserPayload {
      name: string;
      email: string;
      password?: string;
      role: string;
    }

    const payload: UserPayload = { ...form };

    // Não enviar senha vazia
    if (!payload.password || payload.password.trim() === "") {
      delete payload.password;
    }

    try {
      let res: { data: ManagedUser };

      if (editing) {
        res = await api.put(`/users/${editing._id}`, payload);
        setUsers((prev) =>
          prev.map((u) => (u._id === editing._id ? res.data : u))
        );
      } else {
        res = await api.post("/users", payload);
        setUsers((prev) => [...prev, res.data]);
      }

      setOpen(false);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      alert("Erro ao salvar usuário. Verifique os dados.");
    }
  }

  // ----------------------------------------------------------
  // 🗑 Excluir usuário
  // ----------------------------------------------------------
  async function deleteUser(id: string) {
    await api.delete(`/users/${id}`);
    setUsers((prev) => prev.filter((u) => u._id !== id));
  }

  // ----------------------------------------------------------
  // Acesso somente admin
  // ----------------------------------------------------------
  if (!user || user.role !== "admin") {
    return (
      <AppShell userEmail={user?.email} userRole={user?.role} onLogout={logout}>
        <p>Somente administradores podem gerenciar usuários.</p>
      </AppShell>
    );
  }

  // ----------------------------------------------------------
  // Página principal
  // ----------------------------------------------------------
  return (
    <AppShell userEmail={user.email} userRole={user.role} onLogout={logout}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Crie, edite ou remova usuários da plataforma.
          </p>
        </div>

        <Button onClick={openCreate}>Novo usuário</Button>
      </div>

      {loading ? (
        <p>Carregando usuários...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((u) => (
              <TableRow key={u._id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(u)}
                  >
                    Editar
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteUser(u._id)}
                  >
                    Remover
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar usuário" : "Novo usuário"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label>
                Senha{" "}
                {editing && (
                  <span className="text-xs text-muted-foreground">
                    (preencha para alterar)
                  </span>
                )}
              </Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Perfil</Label>
              <Input
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveUser}>
              {editing ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
