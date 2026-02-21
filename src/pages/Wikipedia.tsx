import { useState, useEffect } from "react";
import { Search, ExternalLink, BookOpen, Sparkles, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageContainer } from "@/components/PageContainer";
import BackButton from "@/components/BackButton";
import { DictionaryCard } from "@/components/DictionaryCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface WikiResult {
  title: string;
  snippet: string;
  pageid: number;
}

interface WikiArticle {
  title: string;
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop: { page: string } };
}

export default function Wikipedia() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WikiResult[]>([]);
  const [article, setArticle] = useState<WikiArticle | null>(null);
  const [curiosity, setCuriosity] = useState<string | null>(null);
  const [loadingCuriosity, setLoadingCuriosity] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [bellinha, setBellinha] = useState<{ nome: string; avatar_url: string | null }>({ nome: "Bellinha", avatar_url: null });

  useEffect(() => {
    supabase
      .from("assistant_config")
      .select("avatar_url, recado")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) setBellinha({ nome: "Bellinha", avatar_url: data.avatar_url });
      });
  }, []);
  const fetchCuriosity = async () => {
    setLoadingCuriosity(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-curiosity");
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }
      setCuriosity(data.curiosity);
    } catch (e: any) {
      toast({ title: "Erro", description: "Não foi possível gerar curiosidade.", variant: "destructive" });
    } finally {
      setLoadingCuriosity(false);
    }
  };

  const searchWiki = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setArticle(null);
    try {
      const res = await fetch(
        `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=12`
      );
      const data = await res.json();
      setResults(data.query?.search || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openArticle = async (title: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      );
      const data = await res.json();
      setArticle(data);
    } catch {
      setArticle(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        <BackButton to="/" />

        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Wikipedia</h1>
          <p className="text-xs text-muted-foreground">Pesquise e descubra curiosidades</p>
        </div>

        {/* Curiosity card */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0 rounded-lg ring-1 ring-primary/20 mt-0.5">
              <AvatarImage src={bellinha.avatar_url || undefined} className="rounded-lg object-cover" />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-mono font-bold">
                <Sparkles className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1 flex-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary/60">{bellinha.nome} · Curiosidade</p>
              <AnimatePresence mode="wait">
                {curiosity ? (
                  <motion.p
                    key={curiosity}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-foreground leading-relaxed"
                  >
                    {curiosity}
                  </motion.p>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">
                    Clique abaixo para gerar uma curiosidade
                  </p>
                )}
              </AnimatePresence>
            </div>
          </div>
          <button
            onClick={fetchCuriosity}
            disabled={loadingCuriosity}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            {loadingCuriosity ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {loadingCuriosity ? "Gerando..." : curiosity ? "Outra curiosidade" : "Gerar curiosidade"}
          </button>
        </div>

        {/* Dictionary */}
        <DictionaryCard />

        {/* Search bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); searchWiki(); }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar na Wikipedia..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Buscar
          </button>
        </form>

        {/* Article detail */}
        <AnimatePresence mode="wait">
          {article && (
            <motion.div
              key={article.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-border/30 bg-card/50 p-5 space-y-4"
            >
              <button
                onClick={() => setArticle(null)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Voltar aos resultados
              </button>
              <div className="flex items-start gap-4">
                {article.thumbnail && (
                  <img
                    src={article.thumbnail.source}
                    alt=""
                    className="w-24 h-24 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 space-y-2">
                  <h2 className="text-lg font-bold text-foreground">{article.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{article.extract}</p>
                </div>
              </div>
              {article.content_urls?.desktop?.page && (
                <a
                  href={article.content_urls.desktop.page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                >
                  Artigo completo <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search results */}
        {!article && results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{results.length} resultados</p>
            <div className="space-y-1.5">
              {results.map((r) => (
                <motion.button
                  key={r.pageid}
                  onClick={() => openArticle(r.title)}
                  className="w-full text-left rounded-xl border border-border/20 bg-card/30 hover:bg-muted/30 p-3.5 transition-colors group"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                    <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{r.title}</h3>
                  </div>
                  <p
                    className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: r.snippet }}
                  />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
