"use client";

import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-on-surface font-sans">
      {/* SideNavBar Anchor */}
      <aside className="h-screen w-64 fixed left-0 top-0 z-50 bg-surface border-r border-outline-variant flex flex-col p-md gap-sm">
        <div className="flex items-center gap-md mb-xl px-sm">
          <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div>
            <h1 className="font-h3 text-h3 font-bold text-primary">CraftStock</h1>
            <p className="font-label-md text-label-md text-on-surface-variant">Maker's Workshop</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-xs">
          <a onClick={() => router.push("/")} className={`flex items-center gap-md px-md py-sm rounded-lg cursor-pointer ${pathname === "/" ? "bg-primary-container text-on-primary-container font-bold transition-transform active:scale-[0.98]" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors duration-200"}`}>
            <span className="material-symbols-outlined">home</span>
            <span className="font-body-md">Home</span>
          </a>
          <a onClick={() => router.push("/components")} className={`flex items-center gap-md px-md py-sm rounded-lg cursor-pointer ${pathname === "/components" ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors duration-200"}`}>
            <span className="material-symbols-outlined">extension</span>
            <span className="font-body-md">Components</span>
          </a>
          <a onClick={() => router.push("/risk")} className={`flex items-center gap-md px-md py-sm rounded-lg cursor-pointer ${pathname === "/risk" ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors duration-200"}`}>
            <span className="material-symbols-outlined">notifications</span>
            <span className="font-body-md">Alerts</span>
          </a>
          <a onClick={() => router.push("/settings")} className={`flex items-center gap-md px-md py-sm rounded-lg cursor-pointer ${pathname === "/settings" ? "bg-primary-container text-on-primary-container font-bold" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors duration-200"}`}>
            <span className="material-symbols-outlined">settings</span>
            <span className="font-body-md">Settings</span>
          </a>
        </nav>
      </aside>

      {/* TopNavBar Anchor */}
      <header className="fixed top-0 right-0 w-[calc(100%-256px)] z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
        <div className="flex justify-between items-center h-16 px-gutter max-w-container-max mx-auto w-full">
          <div className="flex items-center bg-surface-container px-md py-xs rounded-full border border-outline-variant w-96">
            <span className="material-symbols-outlined text-on-surface-variant mr-sm">search</span>
            <input className="bg-transparent border-none focus:outline-none focus:ring-0 text-body-sm w-full" placeholder="Search inventory..." type="text"/>
          </div>

          <div className="flex items-center gap-lg">
            <div className="flex items-center gap-md">
              <button className="p-xs hover:bg-surface-container-low rounded-full transition-all cursor-pointer border-none bg-transparent">
                <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
              </button>
              <button className="p-xs hover:bg-surface-container-low rounded-full transition-all cursor-pointer border-none bg-transparent">
                <span className="material-symbols-outlined text-on-surface-variant">help</span>
              </button>
            </div>
            <div className="flex items-center gap-sm border-l border-outline-variant pl-lg">
              <div className="text-right">
                <p className="font-label-md text-label-md text-primary">Bloom &amp; Wick Co.</p>
                <p className="font-body-sm text-[10px] text-on-surface-variant">Production Lead</p>
              </div>
              <img alt="Maker Profile" className="w-10 h-10 rounded-full bg-surface-container object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPENtyd1rHpo3-p6v--w5Gk-LpQD9CXdTsDHFHVUr6weUlZup2ujVqhHC4kvS89X1VVtDSDwowmpsku7eA1Xwhl8FzrL-VrAhpUHY4S71NxGOmJ7mghhihjNEY1CVThU7w2MUDYGrrV2m9K-RPt71QK0l4v0NraUIC2fxFj2nQhiCvQYpQNM4xzPWOl1vHHC6FT4TceWJYaPVvij8nZK7gewVt8i9nF0ZjSlEwBUM6oO7kYK4aomVXDuGwCjya4QvkIWRq2kyZr5ao"/>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-64 pt-24 p-gutter max-w-container-max mx-auto">
        {children}
      </main>
    </div>
  );
}
