import { useState } from "react";
import { Search, BookText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DictResult {
  word: string;
  extract: string;
}

function parsePortuguese(raw: string): string {
  // Extract only the Portuguese section
  const ptMatch = raw.match(/= Português =\n([\s\S]*?)(?:\n= [A-ZÀ-Ú]|$)/);
  const section = ptMatch ? ptMatch[1] : raw;

  // Clean up wiki formatting, keep only useful lines
  return section
    .replace(/={2,}[^=]+=+/g, "") // remove == headers ==
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("AFI:") && !l.startsWith("="))
    .slice(0, 15) // limit output
    .join("\n")
    .trim();
}

export function DictionaryCard() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState<DictResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchWord = async () => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    try {
      const res = await fetch(
        `https://pt.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(trimmed)}&prop=extracts&explaintext=1&format=json&origin=*`
      );
      const json = await res.json();
      const pages = json?.query?.pages;
      const page = pages ? Object.values(pages)[0] as any : null;

      if (!page || page.missing !== undefined || !page.extract) {
        setNotFound(true);
        return;
      }

      const parsed = parsePortuguese(page.extract);
      if (!parsed) {
        setNotFound(true);
        return;
      }

      setResult({ word: page.title || trimmed, extract: parsed });
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/30 bg-card/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <BookText className="h-3.5 w-3.5 text-accent-foreground" />
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
          Dicionário
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          searchWord();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Digite uma palavra..."
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Buscar"}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {notFound && (
          <motion.p
            key="not-found"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-muted-foreground/60 italic"
          >
            Palavra não encontrada. Tente outra.
          </motion.p>
        )}

        {result && (
          <motion.div
            key={result.word}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-2"
          >
            <h3 className="text-base font-bold text-foreground">{result.word}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {result.extract}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}