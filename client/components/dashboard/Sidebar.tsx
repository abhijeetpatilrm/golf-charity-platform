"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Shield,
  Users,
  Ticket,
  Award,
  HandHeart,
} from "lucide-react";

const mainItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Scores", href: "/dashboard/scores", icon: Trophy },
];

const adminItems = [
  { name: "Admin Dashboard", href: "/dashboard/admin", icon: Shield },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Draws", href: "/dashboard/draws", icon: Ticket },
  { name: "Winners", href: "/dashboard/winners", icon: Award },
  { name: "Charities", href: "/dashboard/charities", icon: HandHeart },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderMenuItem = (item: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.name}
        href={item.href}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
          active
            ? "bg-slate-800 text-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.2)]"
            : "text-slate-300 hover:bg-slate-900 hover:text-white"
        }`}
      >
        <Icon
          className={`h-4 w-4 transition-colors ${
            active
              ? "text-emerald-400"
              : "text-slate-500 group-hover:text-slate-300"
          }`}
        />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 md:flex">
      <div className="border-b border-slate-800 px-6 py-6">
        <h1 className="text-lg font-semibold tracking-tight">Golf Charity</h1>
        <p className="mt-1 text-xs text-slate-400">SaaS Dashboard</p>
      </div>

      <nav className="flex-1 space-y-6 px-4 py-5">
        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Main
          </p>
          <div className="space-y-1">{mainItems.map(renderMenuItem)}</div>
        </div>

        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Admin
          </p>
          <div className="space-y-1">{adminItems.map(renderMenuItem)}</div>
        </div>
      </nav>
    </aside>
  );
}
