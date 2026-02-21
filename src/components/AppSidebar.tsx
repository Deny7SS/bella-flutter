import { useState, useEffect } from "react";
import {
  BrainCircuit,
  CalendarDays,
  StickyNote,
  Shield,
  Newspaper,
  Headphones,
  Play,
  BookOpen,
  LogOut,
  Moon,
  Sparkles,
  Wand2,
  CloudSun,
  Gem,
  Leaf,
  Flower2,
  Candy,
  Zap,
  Flame,
  Gamepad2,
  X,
  ChevronRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";

const items = [
  { title: "Notícias", url: "/noticias", icon: Newspaper },
  { title: "Play", url: "/play", icon: Play },
  { title: "Cronograma", url: "/cronograma", icon: CalendarDays },
  { title: "Anotações", url: "/anotacoes", icon: StickyNote },
  { title: "Audiobooks", url: "/audiobooks", icon: Headphones },
  { title: "Livros PDF", url: "/livros-pdf", icon: BookOpen },
  { title: "Wikipedia", url: "/wikipedia", icon: BookOpen },
  { title: "Jogos", url: "/jogos", icon: Gamepad2 },
  { title: "Admin", url: "/admin", icon: Shield },
];

const themeConfig = {
  dark: { icon: Sparkles, label: "Rosa" },
  pink: { icon: Wand2, label: "Hogwarts" },
  hogwarts: { icon: CloudSun, label: "Azul Céu" },
  sky: { icon: Gem, label: "Roxo" },
  purple: { icon: Leaf, label: "Verde" },
  green: { icon: Flower2, label: "Rose" },
  rose: { icon: Candy, label: "Tutti Frutti" },
  tutti: { icon: Zap, label: "Pop" },
  pop: { icon: Flame, label: "Rock" },
  rock: { icon: Moon, label: "Escuro" },
};

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const { profile, signOut } = useAuth();
  const { stopPlayback } = useAudioPlayer();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { icon: ThemeIcon, label: themeLabel } = themeConfig[theme];
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [nomeApp, setNomeApp] = useState("Bella Space");

  useEffect(() => {
    supabase
      .from("admin_config")
      .select("logo_url, nome_app")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data?.logo_url) setLogoUrl(data.logo_url);
        if ((data as any)?.nome_app) setNomeApp((data as any).nome_app);
      });
  }, []);

  const handleNav = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r-0">
      <SidebarContent className="flex flex-col h-full bg-sidebar/95 backdrop-blur-xl">

        {/* ── Header ── */}
        <div className="px-6 pt-10 pb-6 flex items-center justify-between">
          <button
            onClick={() => handleNav("/")}
            className="flex items-center gap-3 group"
          >
            {logoUrl ? (
              <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors ring-1 ring-primary/10">
                <BrainCircuit className="h-4 w-4 text-primary" />
              </div>
            )}
            <span className="font-mono text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors tracking-tight">
              {nomeApp}
            </span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/8 transition-all"
              title={themeLabel}
            >
              <ThemeIcon className="h-3 w-3" />
            </button>
            {isMobile && (
              <button
                onClick={() => setOpenMobile(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/30 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {items.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <button
                key={item.title}
                onClick={() => handleNav(item.url)}
                className={`
                  group relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm transition-all duration-150
                  ${isActive
                    ? "text-foreground"
                    : "text-muted-foreground/60 hover:text-foreground/80 hover:bg-muted/20"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
                )}

                <span className={`
                  flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150
                  ${isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-transparent text-current group-hover:bg-muted/30"
                  }
                `}>
                  <item.icon className="h-3.5 w-3.5" />
                </span>

                <span className="font-mono text-xs tracking-wide flex-1 text-left">{item.title}</span>

                {isActive && (
                  <ChevronRight className="h-3 w-3 text-primary/50 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div className="px-4 pb-8 pt-4">
          <div className="h-px bg-border/20 mb-4" />

          <button
            onClick={() => handleNav("/perfil")}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 hover:bg-muted/20 transition-all group mb-1"
          >
            <Avatar className="h-7 w-7 shrink-0 rounded-lg ring-1 ring-primary/10 group-hover:ring-primary/25 transition-all">
              <AvatarImage src={profile?.avatar_url || undefined} className="rounded-lg" />
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-mono font-bold rounded-lg">
                {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-mono font-medium text-foreground/70 group-hover:text-foreground/90 truncate transition-colors">
                {profile?.display_name || "Usuário"}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/40">
                {profile?.coins ?? 0} moedas
              </p>
            </div>
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2 text-muted-foreground/40 hover:text-destructive/70 hover:bg-destructive/5 transition-all"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center">
              <LogOut className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-mono tracking-wide">Sair</span>
          </button>
        </div>
      </SidebarContent>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="max-w-[280px] rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/5 p-0 overflow-hidden">
          <div className="flex flex-col items-center text-center px-6 pt-6 pb-4">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-3 ring-1 ring-destructive/20">
              <LogOut className="h-4 w-4 text-destructive" />
            </div>
            <AlertDialogHeader className="space-y-1">
              <AlertDialogTitle className="text-sm font-bold tracking-tight">
                Deseja sair?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground/70 leading-relaxed">
                Seu progresso está salvo.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="flex-row gap-2 border-t border-border/30 bg-muted/20 px-4 py-3 sm:space-x-0">
            <AlertDialogCancel className="flex-1 m-0 h-8 text-xs rounded-lg border-border/50 bg-transparent hover:bg-muted/50 font-medium">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { stopPlayback(); signOut(); }}
              className="flex-1 m-0 h-8 text-xs rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium shadow-lg shadow-destructive/20"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
