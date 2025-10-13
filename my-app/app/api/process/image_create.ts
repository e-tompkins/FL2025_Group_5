import OpenAI from "openai";
const client = new OpenAI();

export default async function imageCreate(words: string[]) {
  const list = Array.isArray(words) ? words.join(", ") : String(words || "");
  const prompt = `Pretend you are an expert in visual image creation. Write a one sentence text description of a hypothetical educational diagram that you made based on the following words: ${list}`;

  const response = await client.responses.create({
    model: "gpt-3.5-turbo",
    input: prompt,
  });

  return response.output_text;
}
