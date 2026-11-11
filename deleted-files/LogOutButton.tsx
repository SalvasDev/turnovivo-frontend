'use client';

import { useAuth } from '@/context/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button
      type="button"
      onClick={logout}
      className="text-xs bg-zinc-800 hover:bg-red-500/10 text-zinc-300 hover:text-red-400 border border-zinc-700/60 hover:border-red-500/20 font-bold px-4 py-2 rounded-lg transition-all duration-200"
    >
      Cerrar Sesión
    </button>
  );
}