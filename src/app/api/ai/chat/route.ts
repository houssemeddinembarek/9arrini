import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { message, context, history } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: "Message required" }, { status: 400 });
    }

    const subject = typeof context === "string" && context.trim() ? context.trim() : "Général";

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // If no valid API key, return an education-focused mock response for demo.
    if (!apiKey || apiKey === "sk-placeholder") {
      const mockResponses = [
        `Bonne question ! 👇\n\nVoici une explication adaptée à ton niveau :\n\n1. **L'idée principale** — on commence par la notion de base.\n2. **Étape par étape** — on décompose le raisonnement.\n3. **Un exemple** — pour bien comprendre.\n\nVeux-tu que je te propose un **exercice** pour t'entraîner ?`,
        `Avec plaisir ! Voici comment aborder cet exercice :\n\n**Méthode :**\n- D'abord, on identifie ce que l'énoncé demande.\n- Ensuite, on applique la bonne formule / règle.\n- Enfin, on vérifie le résultat.\n\nEnvoie-moi ta réponse et je te la **corrige** avec les explications.`,
        `Voici un **résumé** clair :\n\n> Retiens surtout les points essentiels de la leçon.\n\n- Point clé 1\n- Point clé 2\n- Point clé 3\n\nSouhaites-tu un **devoir type** avec correction pour réviser ?`,
      ];

      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

      return NextResponse.json({
        success: true,
        data: {
          message: randomResponse,
          role: "assistant",
        },
      });
    }

    const systemPrompt = `Tu es Aria, l'assistant pédagogique de Telmidhi, une plateforme éducative tunisienne destinée aux élèves du collège et du lycée.

Ton rôle est STRICTEMENT limité au soutien scolaire. Tu aides l'élève à :
- Comprendre une leçon ou une notion du programme (mathématiques, physique-chimie, SVT, français, anglais, arabe, histoire-géographie, informatique, philosophie, etc.).
- S'entraîner avec des exercices adaptés à son niveau.
- Corriger ses exercices et ses devoirs en expliquant chaque étape du raisonnement, pas seulement la réponse finale.
- Résumer une leçon ou un texte.
- Préparer les examens, les concours et le Baccalauréat.

Règles importantes :
- Réponds en français par défaut (ou en arabe / anglais si la matière ou l'élève le demande).
- Adapte le vocabulaire et la difficulté au niveau collège/lycée tunisien et au programme officiel.
- Pour une correction, explique les erreurs et la bonne démarche afin que l'élève apprenne.
- Refuse poliment toute demande qui n'est pas scolaire (divertissement, conseils personnels, contenu inapproprié, triche à un examen surveillé, etc.) et réoriente l'élève vers ses révisions.
- Sois bienveillant, encourageant et clair. Utilise le markdown (titres, listes, **gras**) pour structurer ta réponse.

Mise en forme des mathématiques (TRÈS IMPORTANT) :
- Écris TOUTES les formules, équations et symboles mathématiques en LaTeX.
- Formule dans le texte : entoure-la d'un seul dollar, ex. $x^2 + 3x - 4 = 0$.
- Formule importante ou centrée : entoure-la de deux dollars sur sa propre ligne, ex. $$\\Delta = b^2 - 4ac$$.
- N'écris JAMAIS de mathématiques à l'intérieur de blocs de code ou entre accents graves (\`) — réserve les accents graves au code informatique uniquement.
- Utilise les commandes LaTeX habituelles : \\frac{a}{b}, \\sqrt{x}, x^{2}, x_{i}, \\times, \\div, \\leq, \\geq, \\pi, \\alpha, etc.
- Le rendu LaTeX est automatique : l'élève verra de vraies formules, jamais les symboles « $ » ou « \\ ».

Matière actuelle de l'élève : ${subject}`;

    // Build the message list with prior turns so the chat keeps context.
    const priorTurns = Array.isArray(history)
      ? history
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-10)
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      : [];

    // Claude requires the conversation to begin with a user turn; drop any
    // leading assistant turn the -10 window may have started on.
    while (priorTurns.length && priorTurns[0].role === "assistant") priorTurns.shift();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 1024,
        temperature: 0.6,
        system: systemPrompt,
        messages: [
          ...priorTurns,
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Claude API error:", response.status, detail);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const aiMessage =
      data.content?.find((b: { type: string }) => b.type === "text")?.text ||
      "Je n'ai pas pu générer de réponse.";

    return NextResponse.json({
      success: true,
      data: { message: aiMessage, role: "assistant" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ success: false, error: "AI service unavailable" }, { status: 500 });
  }
}
