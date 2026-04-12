"use client";

interface BottomNavProps {
  active: "dashboard" | "meals" | "add" | "chat" | "progress";
}

const TABS = [
  { key: "dashboard", icon: "▣", label: "Dashboard", href: "/dashboard" },
  { key: "meals", icon: "🍽", label: "Meals", href: "/meals" },
  { key: "add", icon: "+", label: "Add", href: "/add" },
  { key: "chat", icon: "💬", label: "Chat", href: "/chat" },
  { key: "progress", icon: "📊", label: "Progress", href: "/progress" },
] as const;

export default function BottomNav({ active }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 backdrop-blur-xl rounded-t-[2rem] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        if (tab.key === "add") {
          return (
            <a key={tab.key} className="flex flex-col items-center -mt-10" href={tab.href}>
              <div className="w-14 h-14 bg-primary-gradient rounded-full flex items-center justify-center text-white shadow-xl text-2xl">
                +
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold mt-1 text-primary">
                {tab.label}
              </span>
            </a>
          );
        }
        return (
          <a
            key={tab.key}
            className={`flex flex-col items-center transition-colors ${
              isActive ? "text-primary scale-105" : "text-stone-400 opacity-60 hover:text-primary"
            }`}
            href={tab.href}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold mt-1">{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
