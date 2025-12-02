import OpenAI from "openai";
const client = new OpenAI();

export default async function imageCreate(words: string[]) {
  const list = Array.isArray(words) ? words.join(", ") : String(words || "");
  const prompt = `Pretend you are an expert in animated educational visuals. Send me the code using the anime.js api to build a simple visualization of X topic such that a student visual learner can understand the concept better. ${list}`;

  const description = await client.responses.create({
    model: "gpt-3.5-turbo",
    input: prompt,
  });

  const animeCode = await client.responses.create({
    model: "gpt-4-turbo",
    input: prompt,
  });

  const descText = (description && (description as any).output_text) || "";
  const animeJsCode = (animeCode && (animeCode as any).output_text) || "";
  return { descText, animeJsCode };
}
