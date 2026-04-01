import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type DashboardLayoutProps = {
  children: ReactNode;
  title: string;
};

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />

      <div className="md:pl-72">
        <Topbar title={title} />
        <main className="mx-auto w-full max-w-7xl px-6 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
