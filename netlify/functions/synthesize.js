import OpenAI from "openai";

export default async (req, ctx) => {
  // 1 parse POST body
  const { pomData, procedureData, language = "English" } = await req.json();

  // 2 assemble prompt
  const prompt = `
You are an expert inorganic chemist.
Compose a clear, step-by-step laboratory synthesis for the compound below.

${JSON.stringify(procedureData, null, 2)}

Return the text in ${language}.
  `.trim();

  // 3 call OpenAI (key comes from env var)
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const chat = await openai.chat.completions.create({
    model: "gpt-4.1-nano-2025-04-14",
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }]
  });

  // 4 ship the response back to the browser
  return Response.json({ text: chat.choices[0].message.content });
};
