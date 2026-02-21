import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon-512.png"],
      manifest: {
        id: "/",
        name: "Bella Space",
        short_name: "Bella Space",
        description: "Plataforma de estudos para Sistemas de Informação",
        theme_color: "#7c3aed",
        background_color: "#0f0d17",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "any",
        start_url: "/",
        scope: "/",
        lang: "pt-BR",
        dir: "ltr",
        categories: ["education", "productivity"],
        prefer_related_applications: false,
        iarc_rating_id: "e84b072d-71b3-4d3e-86ae-31a8ce4e53b7",
        icons: [
          { src: "/icon-512.png", sizes: "512x512", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", purpose: "maskable" },
        ],
        screenshots: [
          {
            src: "/icon-512.png",
            sizes: "512x512",
            form_factor: "narrow",
            label: "Bella Space - Tela inicial",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            form_factor: "wide",
            label: "Bella Space - Tela principal",
          },
        ],
        shortcuts: [
          {
            name: "Estudar",
            short_name: "Estudar",
            description: "Acessar cursos e módulos",
            url: "/curso",
            icons: [{ src: "/icon-512.png", sizes: "512x512" }],
          },
          {
            name: "Flashcards",
            short_name: "Flashcards",
            description: "Praticar com flashcards",
            url: "/flashcards",
            icons: [{ src: "/icon-512.png", sizes: "512x512" }],
          },
          {
            name: "Progresso",
            short_name: "Progresso",
            description: "Ver meu progresso",
            url: "/progresso",
            icons: [{ src: "/icon-512.png", sizes: "512x512" }],
          },
        ],
        launch_handler: {
          client_mode: ["navigate-existing", "auto"],
        },
        related_applications: [
          {
            platform: "webapp",
            url: "https://bella-learns-it.lovable.app/manifest.webmanifest",
          },
        ],
        share_target: {
          action: "/",
          method: "GET",
          params: { title: "title", text: "text", url: "url" },
        },
        protocol_handlers: [
          {
            protocol: "web+bellaspace",
            url: "/?protocol=%s",
          },
        ],
        file_handlers: [
          {
            action: "/",
            accept: { "text/plain": [".txt"] },
          },
        ],
        widgets: [
          {
            name: "Bella Space",
            description: "Acesso rápido ao app de estudos",
            tag: "bella-space-widget",
            ms_ac_template: "/widget-template.json",
            data: "/widget-data.json",
            type: "application/json",
            screenshots: [{ src: "/icon-512.png", sizes: "512x512", label: "Bella Space Widget" }],
            icons: [{ src: "/icon-512.png", sizes: "512x512" }],
            auth: false,
            update: 86400,
          },
        ],
        note_taking: {
          new_note_url: "/anotacoes",
        },
        scope_extensions: [
          { origin: "https://bella-learns-it.lovable.app" },
        ],
        edge_side_panel: { preferred_width: 400 },
      } as Record<string, unknown>,
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MiB
        cacheId: "bella-space-v2",
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
