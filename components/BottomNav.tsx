"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, BarChart2, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <div className="h-[72px] bg-[#0f172a] border-t border-[#1e293b] flex justify-around items-center pb-2 shrink-0">
      <NavItem href="/" icon={<Home strokeWidth={2.5} className="w-6 h-6" />} label="Home" active={pathname === '/'} />
      <NavItem href="/challenge" icon={<Gamepad2 strokeWidth={2.5} className="w-6 h-6" />} label="Challenge" active={pathname?.startsWith('/challenge') ?? false} />
      <NavItem href="/statistik" icon={<BarChart2 strokeWidth={2.5} className="w-6 h-6" />} label="Statistik" active={pathname === '/statistik'} />
      <NavItem href="/profil" icon={<User strokeWidth={2.5} className="w-6 h-6" />} label="Profil" active={pathname === '/profil'} />
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link href={href} className={cn("flex flex-col items-center gap-1 transition-colors relative px-4", active ? "text-[#3b82f6]" : "text-[#64748b] hover:text-slate-300")}>
      <div className={cn("flex items-center justify-center p-1 rounded-lg transition-transform", active && "scale-110")}>
        {icon}
      </div>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  );
}
