'use client';

import { useCallback, useMemo, useState } from 'react';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface BusinessAdmin {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerEmail: string;
  active: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = (payload as { message?: string | string[] } | null)?.message;
    throw new Error(
      Array.isArray(message) ? message.join(', ') : message || 'Error en la petición.',
    );
  }

  return payload as T;
}

interface SuperAdminBusinessesClientProps {
  token: string;
  userEmail: string;
  initialBusinesses: BusinessAdmin[];
  initialAdmins: AdminUser[];
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EMPTY_FORM = { name: '', slug: '', ownerId: '' };
const EMPTY_OWNER = { email: '', password: '' };

export default function SuperAdminBusinessesClient({
  token,
  userEmail,
  initialBusinesses,
  initialAdmins,
}: SuperAdminBusinessesClientProps) {
  const { success, error, confirm } = useUI();
  const { logout } = useAuth();

  const [businesses, setBusinesses] = useState<BusinessAdmin[]>(initialBusinesses);
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [newOwnerMode, setNewOwnerMode] = useState(false);
  const [newOwner, setNewOwner] = useState(EMPTY_OWNER);

  const refresh = useCallback(async () => {
    try {
      const [biz, adm] = await Promise.all([
        apiFetch<BusinessAdmin[]>('/businesses', token, { cache: 'no-store' }),
        apiFetch<AdminUser[]>('/admin/users?role=ADMIN', token, { cache: 'no-store' }),
      ]);
      setBusinesses(biz);
      setAdmins(adm);
    } catch (err: unknown) {
      error(getErrorMessage(err, 'No se pudieron cargar los datos.'));
    }
  }, [token, error]);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setNewOwnerMode(false);
    setNewOwner(EMPTY_OWNER);
  };

  const startEdit = (business: BusinessAdmin) => {
    setEditingId(business.id);
    setForm({ name: business.name, slug: business.slug, ownerId: business.ownerId });
    setSlugTouched(true);
    setNewOwnerMode(false);
    setNewOwner(EMPTY_OWNER);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const validate = (): string | null => {
    if (form.name.trim().length < 3) {
      return 'El nombre debe tener al menos 3 caracteres.';
    }
    if (!SLUG_REGEX.test(form.slug)) {
      return 'El slug debe ser minúsculas y guiones (ej: barberia-premium).';
    }
    if (newOwnerMode) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newOwner.email)) {
        return 'El correo del nuevo dueño no es válido.';
      }
      if (newOwner.password.length < 6) {
        return 'La contraseña del dueño debe tener al menos 6 caracteres.';
      }
    } else if (!form.ownerId) {
      return 'Selecciona un dueño (ADMIN) para la empresa.';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      error(validationError);
      return;
    }

    setSubmitting(true);
    try {
      let ownerId = form.ownerId;

      if (newOwnerMode) {
        const createdOwner = await apiFetch<AdminUser>('/admin/users', token, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: newOwner.email.trim(), password: newOwner.password }),
        });
        ownerId = createdOwner.id;
        setAdmins((prev) => [...prev, createdOwner].sort((a, b) => a.email.localeCompare(b.email)));
      }

      if (editingId) {
        await apiFetch<BusinessAdmin>(`/businesses/${editingId}`, token, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name.trim(), slug: form.slug.trim(), ownerId }),
        });
        success('Empresa actualizada correctamente.');
      } else {
        await apiFetch<BusinessAdmin>('/businesses', token, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name.trim(), slug: form.slug.trim(), ownerId }),
        });
        success('Empresa creada correctamente.');
      }

      resetForm();
      await refresh();
    } catch (err: unknown) {
      error(getErrorMessage(err, 'No se pudo guardar la empresa.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (business: BusinessAdmin) => {
    const activate = !business.active;
    const confirmed = await confirm({
      title: activate ? 'Reactivar empresa' : 'Desactivar empresa',
      description: activate
        ? `¿Reactivar "${business.name}"? Volverá a ser visible y reservable.`
        : `¿Desactivar "${business.name}"? Dejará de ser visible y reservable al público.`,
      confirmText: activate ? 'Sí, reactivar' : 'Sí, desactivar',
      cancelText: 'Volver',
      tone: activate ? 'default' : 'danger',
    });
    if (!confirmed) {
      return;
    }

    try {
      if (activate) {
        await apiFetch<BusinessAdmin>(`/businesses/${business.id}`, token, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: business.name,
            slug: business.slug,
            ownerId: business.ownerId,
            active: true,
          }),
        });
      } else {
        await apiFetch<void>(`/businesses/${business.id}`, token, { method: 'DELETE' });
      }
      success(activate ? 'Empresa reactivada.' : 'Empresa desactivada.');
      await refresh();
    } catch (err: unknown) {
      error(getErrorMessage(err, 'No se pudo actualizar el estado.'));
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

  const noAdmins = useMemo(() => admins.length === 0, [admins]);

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50 pb-16" aria-labelledby="super-admin-title">
      <nav className="w-full border-b border-zinc-800 bg-zinc-900/60 py-4 px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tighter text-amber-500">TurnoVivo</span>
            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-400">
              GESTIÓN DE EMPRESAS
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>
              Super Admin: <span className="font-medium text-zinc-200">{userEmail}</span>
            </span>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 font-semibold text-red-400 hover:border-red-500/50 hover:bg-red-500/10"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto mt-8 w-full max-w-6xl px-4">
        <header className="mb-8">
          <h1 id="super-admin-title" className="text-3xl font-black tracking-tight text-zinc-100">
            Empresas de la plataforma
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Crea y administra los negocios registrados. Cada empresa requiere un dueño con rol ADMIN.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="h-fit rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
            aria-label={editingId ? 'Editar empresa' : 'Crear empresa'}
          >
            <h2 className="mb-4 text-lg font-bold text-zinc-100">
              {editingId ? 'Editar empresa' : 'Nueva empresa'}
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="biz-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Nombre
                </label>
                <input
                  id="biz-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Barbería Premium"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="biz-slug" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Slug (URL)
                </label>
                <input
                  id="biz-slug"
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                  placeholder="barberia-premium"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 font-mono text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="biz-owner" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Dueño (ADMIN)
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewOwnerMode((prev) => !prev)}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300"
                  >
                    {newOwnerMode ? 'Elegir existente' : '+ Crear nuevo dueño'}
                  </button>
                </div>

                {newOwnerMode ? (
                  <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <input
                      type="email"
                      value={newOwner.email}
                      onChange={(e) => setNewOwner((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="dueno@empresa.com"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      type="password"
                      value={newOwner.password}
                      onChange={(e) => setNewOwner((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Contraseña (mín. 6)"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-zinc-500">Se creará un usuario con rol ADMIN y se asignará como dueño.</p>
                  </div>
                ) : (
                  <select
                    id="biz-owner"
                    value={form.ownerId}
                    onChange={(e) => setForm((prev) => ({ ...prev, ownerId: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">— Selecciona un dueño —</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.email}
                      </option>
                    ))}
                  </select>
                )}
                {noAdmins && !newOwnerMode && (
                  <p className="mt-1.5 text-[11px] text-amber-400">
                    No hay administradores. Crea uno nuevo para asignarlo como dueño.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-amber-600 disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear empresa'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:border-zinc-600"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* List */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-2">
            {businesses.length === 0 ? (
              <p className="p-8 text-center text-sm text-zinc-500">Aún no hay empresas registradas.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">Dueño</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((business) => (
                    <tr key={business.id} className="border-b border-zinc-800/60 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-100">{business.name}</p>
                        <p className="font-mono text-[11px] text-zinc-500">/{business.slug}</p>
                        <p className="text-[10px] text-zinc-600">Alta: {formatDate(business.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-300">{business.ownerEmail}</td>
                      <td className="px-4 py-3">
                        {business.active ? (
                          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            ACTIVA
                          </span>
                        ) : (
                          <span className="rounded-md bg-zinc-700/40 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                            INACTIVA
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(business)}
                            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-amber-500/50 hover:text-amber-400"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(business)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                              business.active
                                ? 'border border-zinc-700 text-red-400 hover:border-red-500/50 hover:bg-red-500/10'
                                : 'border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {business.active ? 'Desactivar' : 'Reactivar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
