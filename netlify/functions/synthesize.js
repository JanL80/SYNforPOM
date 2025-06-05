// netlify/functions/synthesize.js
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY   // <-- reads the env-var you set in step 1
});

export async function handler(event) {
  // only allow POSTs ---------------------------------------------------
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // parse and sanity-check the payload --------------------------------
  const { pomId, procedure } = JSON.parse(event.body || "{}");
  if (!pomId || !procedure) {
    return { statusCode: 400, body: "Missing pomId or procedure" };
  }

  try {
    // ask the model to re-create the synthesis text -------------------
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system",
          content: "You are a chemistry assistant. Rephrase the given " +
                   "procedure clearly for a synthetic chemist." },
        { role: "user", content: procedure }
      ]
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ synthesis: chat.choices[0].message.content })
    };
  } catch (err) {
    console.error("OpenAI error →", err);
    return { statusCode: 500, body: "Internal Server Error" };
  }
}
