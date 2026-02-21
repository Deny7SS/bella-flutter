import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use same provider/model config as assistant
    const { data: config } = await supabase
      .from("assistant_config")
      .select("model, provider, curiosity_prompt")
      .eq("id", 1)
      .single();

    const curiositySystemPrompt = (config as any)?.curiosity_prompt || "Você é um gerador de curiosidades. Gere exatamente 1 curiosidade interessante e surpreendente sobre ciência, natureza, tecnologia, história ou o mundo. A curiosidade deve ser um fato real, verificável e fascinante. Responda APENAS com o texto da curiosidade, sem prefixos como 'Você sabia que' ou numeração. Seja conciso (máximo 2 frases).";

    const useProvider = config?.provider || "openrouter";
    let apiUrl: string;
    let apiKey: string;
    let extraHeaders: Record<string, string> = {};

    if (useProvider === "lovable") {
      apiKey = Deno.env.get("LOVABLE_API_KEY") || "";
      if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    } else {
      const { data: keysData } = await supabase
        .from("api_keys_config")
        .select("openrouter_api_key")
        .eq("id", 1)
        .single();
      apiKey = keysData?.openrouter_api_key || Deno.env.get("OPENROUTER_API_KEY") || "";
      if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      extraHeaders["HTTP-Referer"] = supabaseUrl;
    }

    const selectedModel = config?.model || (useProvider === "lovable" ? "google/gemini-3-flash-preview" : "openai/gpt-4o-mini");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: curiositySystemPrompt,
          },
          {
            role: "user",
            content: "Gere uma curiosidade aleatória e interessante.",
          },
        ],
        max_tokens: 200,
        temperature: 1.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit atingido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao gerar curiosidade" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const curiosity = data.choices?.[0]?.message?.content?.trim() || "Não foi possível gerar uma curiosidade.";

    return new Response(
      JSON.stringify({ curiosity }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-curiosity error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
