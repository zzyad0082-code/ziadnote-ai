import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const text = body.text;

    const examText = body.examText;

    let prompt = "";

    if (examText) {

      prompt = `

You are an AI exam solving assistant.

You have source material and an exam.

Your task:
- Answer all exam questions using ONLY the source material.
- Be accurate and educational.
- If the answer does not exist in source material say:
"Answer not found in source."

FORMAT:

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

    } else {

      prompt = `

You are an AI study assistant.

Your task:

1- Create a short and clean summary.

2- Create exactly 10 multiple choice quiz questions.

Rules:
- Every question must have:
a)
b)
c)

- Add the correct answer after each question.

- Make the questions clear and educational.

FORMAT:

# Summary

summary here

# Quiz Questions

1.
Question here

a)
b)
c)

Answer:

TEXT:
${text}

`;

    }

    const chatCompletion =
      await groq.chat.completions.create({

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],

        model: "llama-3.3-70b-versatile",

      });

    return Response.json({

      result:
        chatCompletion.choices[0]?.message?.content
        || "No AI response",

    });

  } catch (error) {

    console.log(error);

    return Response.json({

      result: "AI Error",

    });

  }

}