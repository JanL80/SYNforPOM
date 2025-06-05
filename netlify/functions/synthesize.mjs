/*  netlify/functions/synthesize.mjs
    Classic Netlify Function – ES Module version
    Requires:  "type": "module"  in /package.json  OR  .mjs extension
*/

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY           // ← make sure this env-var is set
});

// ---------------------------------------------------------------------------
// Netlify will call this “handler” for every POST /.netlify/functions/synthesize
// ---------------------------------------------------------------------------
export async function handler(event) {
  // ---------- 1. METHOD GUARD --------------------------------------------
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // ---------- 2. PAYLOAD PARSE + VALIDATION ------------------------------
  let pomId, procedure;
  try {
    ({ pomId, procedure } = JSON.parse(event.body ?? "{}"));
  } catch {
    return { statusCode: 400, body: "Bad JSON in request body" };
  }

  if (!pomId || !procedure) {
    return { statusCode: 400, body: "Missing pomId or procedure" };
  }

  // ---------- 3. CALL OPENAI --------------------------------------------
  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",                   // pick any model your key can use
      messages: [
        {
          role: "system",
          content:
            "You are an expert inorganic chemist. " +
            "Rewrite the following laboratory procedure clearly and concisely."
        },
        { role: "user", content: JSON.stringify(procedure, null, 2) }
      ],
      temperature: 0.2
    });

    const synthesis = chat.choices[0].message.content.trim();

    // ---------- 4. SUCCESS RESPONSE -------------------------------------
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: synthesis })
    };
  } catch (err) {
    // ---------- 5. ERROR RESPONSE (bubble message up to caller) ---------
    console.error("OpenAI error →", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
}
