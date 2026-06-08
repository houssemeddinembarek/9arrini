import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { message, context } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: "Message required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // If no valid API key, return a smart mock response for demo
    if (!apiKey || apiKey === "sk-placeholder") {
      const mockResponses = [
        `Great question! As an AI tutor on Skillora, I can help you understand **${message.slice(0, 30)}...**\n\nHere's a detailed explanation:\n\n1. **Key concept**: This is fundamental to the topic\n2. **How it works**: Breaking it down step by step\n3. **Practical example**: Let's apply this to a real scenario\n\nWould you like me to elaborate on any of these points?`,
        `I'd be happy to help you with that! Let me break down the concept for you:\n\n**Understanding the basics:**\nThis topic is important because it forms the foundation of more advanced concepts.\n\n**Step-by-step approach:**\n- First, understand the core principles\n- Then practice with examples\n- Finally, apply it to real problems\n\nFeel free to ask follow-up questions!`,
        `Excellent question! Here's what you need to know:\n\n> This is a key insight that will help you master this topic.\n\nThe main points to remember are:\n1. Start with the fundamentals\n2. Build on what you know\n3. Practice regularly\n\nWant me to generate a quiz to test your understanding?`,
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

    const systemPrompt = `You are Aria, an intelligent AI educational assistant on the Skillora platform.
    You help students learn effectively by:
    - Explaining concepts clearly and concisely
    - Providing examples and analogies
    - Answering questions about course material
    - Generating practice quizzes
    - Summarizing content
    - Encouraging and motivating learners

    Context: ${context || "General learning assistance"}

    Be friendly, encouraging, and educational. Use markdown formatting for clarity.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("AI service error");
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || "I couldn't generate a response.";

    return NextResponse.json({
      success: true,
      data: { message: aiMessage, role: "assistant" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ success: false, error: "AI service unavailable" }, { status: 500 });
  }
}
