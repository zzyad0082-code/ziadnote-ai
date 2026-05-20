import Groq from "groq-sdk";

export const runtime = "nodejs"; // مهم جدًا لـ Vercel

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const text = body?.text || "";
    const examText = body?.examText || "";

    if (!text) {
      return Response.json({
        result: "No input text provided",
      });
    }

    let prompt = "";

    // ===================== EXAM MODE =====================
    if (examText) {
      prompt = `
You are an AI exam solving assistant.

Rules:
- Use ONLY the source material.
- If answer not found, say: "Answer not found in source."

Format:

# Exam Answers

1.
Answer:

2.
Answer:

SOURCE MATERIAL:
${text}

EXAM:
${examText}
`;
    }

    // ===================== STUDY MODE =====================
    else {
      prompt = `
You are an AI study assistant.

Tasks:
1. Write a simple summary.
2. Create exactly 10 multiple-choice questions.

Rules:
- Each question must have a, b, c options.
- Add correct answer at the end.

Format:

# Summary

...

# Quiz Questions

1.
Question

a)
b)
c)

Answer:

TEXT:
${text}
`;
    }

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return Response.json({
      result:
        chatCompletion.choices[0]?.message?.content ||
        "No AI response",
    });
  } catch (error) {
    console.error("API Error:", error);

    return Response.json({
      result: "AI Error occurred",
    });
  }
}
