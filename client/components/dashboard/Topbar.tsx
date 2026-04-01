"use client";

import { useEffect, useMemo, useState } from "react";
import { clearStoredAuthToken, getMe, type AuthUser } from "@/services/api";

type TopbarProps = {
  title: string;
};

export default function Topbar({ title }: TopbarProps) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const response = await getMe();
        setUser(response.user || null);
      } catch {
        setUser(null);
      }
    };

    loadMe();
  }, []);

  const initials = useMemo(() => {
    if (!user?.email) {
      return "AU";
    }

    return user.email.slice(0, 2).toUpperCase();
  }, [user]);

  const handleLogout = () => {
    clearStoredAuthToken();
    window.location.href = "/auth";
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="text-sm font-medium text-slate-700">
              {user?.email || "Local Admin (Dev)"}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-sm font-semibold text-white shadow-sm">
            {initials}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
