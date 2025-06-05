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
      model: "gpt-4o-mini",                   // model-selection
      messages: [
        {
          role: "system",
          content:
            "You are an expert inorganic chemist." +
            "Your task is to turn laboratory-procedure data (provided as JSON) into a clear, precise synthesis description that could go straight into an experimental section of a journal article. " +
            "Write exactly one paragraph of running text; No headings, lists, tables, line breaks, code fences, or commentary. " +
            "If a field is missing or undefined, omit it without mention. " +
            "Use SI units with numbers (e.g. “2.50 g”, “10 mL”) and standard chemical nomenclature. " +
            "Do not add anything that cannot be derived from the data."
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
