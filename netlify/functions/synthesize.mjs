
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function handler(event) {


    
  // ---------- METHOD GUARD --------------------------------------------
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }


  // ---------- PAYLOAD PARSE + VALIDATION ------------------------------
  let pomId, procedure, language;
  try {
    ({ pomId, procedure, language } = JSON.parse(event.body ?? "{}"));
  } catch {
    return { statusCode: 400, body: "Bad JSON in request body" };
  }

  if (!pomId || !procedure) {
    return { statusCode: 400, body: "Missing pomId or procedure" };
  }

  const langRaw = typeof language === "string" ? language.trim() : "";
  const lang = langRaw || "English";
  const safeLang = lang.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ()-]/g, "") || "English";

  const systemContent = [
    "You are an expert inorganic chemist.",
    "Your task is to turn laboratory-procedure data (provided as JSON) into a clear, precise synthesis description that could go straight into an experimental section of a journal article.",
    "Write exactly one paragraph of running text; No headings, lists, tables, line breaks, code fences, or commentary.",
    "If a field is missing or undefined, omit it without mention.",
    "Use SI units with numbers (e.g. “2.50 g”, “10 mL”) and standard chemical nomenclature.",
    "Do not add anything that cannot be derived from the data.",
    `Output the paragraph in ${safeLang}.`
  ].join(" ");

  
  // ---------- CALL OPENAI --------------------------------------------
  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemContent
        },
        { role: "user", content: JSON.stringify(procedure, null, 2) }
      ],
      temperature: 0.2
    });

    const synthesis = chat.choices[0].message.content.trim();


    // ---------- SUCCESS RESPONSE -------------------------------------
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: synthesis })
    };
  } catch (err) {


    // ---------- ERROR RESPONSE ---------------------------------------
    console.error("OpenAI error →", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
}
