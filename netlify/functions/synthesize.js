import OpenAI from "openai";

/**  POST /.netlify/functions/synthesize  */
export const handler = async (event) => {
  try {
    // ---------- request body ----------
    const { pomData, procedureData, language = "English" } = JSON.parse(
      event.body ?? "{}"
    );

    // ---------- build prompt ----------
    const prompt = `
You are an expert inorganic chemist.
Using the experimental details below, write a clear, step-by-step laboratory
synthesis for the compound.  Return the text in ${language}.

${JSON.stringify(procedureData, null, 2)}
`;

    // ---------- OpenAI call ----------
    const openai = new OpenAI();          // uses OPENAI_API_KEY from env
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",               // pick a valid model name
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    });

    // ---------- success ----------
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: chat.choices[0].message.content })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
