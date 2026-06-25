"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Dumbbell, ShieldAlert, LogOut, Leaf } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const path = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = (user?.display_name || user?.email || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const firstName = user?.display_name?.split(" ")[0] || user?.email?.split("@")[0] || "";

  const pill = (href: string) =>
    `inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-lg transition-all ${
      path === href
        ? "bg-white text-teal-700 font-semibold shadow-sm ring-1 ring-slate-900/5"
        : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
      <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-6">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-800 tracking-tight text-[15px]">Companion</span>
        </Link>

        {/* Segmented nav — centred */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
            <Link href="/dashboard" className={pill("/dashboard")}>
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <Link href="/exercises" className={pill("/exercises")}>
              <Dumbbell className="w-3.5 h-3.5" />
              Exercises
            </Link>
            {user?.is_admin && (
              <Link href="/admin" className={pill("/admin")}>
                <ShieldAlert className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-white leading-none">{initials}</span>
          </div>

          <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[100px] truncate">
            {firstName}
          </span>

          <button
            onClick={handleLogout}
            title="Log out"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </nav>
    </header>
  );
}
