import OpenAI from "openai";
const client = new OpenAI();

export default async function imageCreate(words: string[]) {
  const list = Array.isArray(words) ? words.join(", ") : String(words || "");
  const prompt = `Pretend you are an expert in visual image creation. Write a one sentence text description of a hypothetical educational diagram that you made based on the following words: ${list}`;

  const description = await client.responses.create({
    model: "gpt-3.5-turbo",
    input: prompt,
  });

  const image = await client.images.generate({
  model: "dall-e-3",
  prompt: `A high-quality, technical educational diagram. It can be simple, like a line diagram. Prioritize clarity and educational value. Use a clean, minimalistic style with clear labels and annotations. Avoid unnecessary details or artistic elements that do not contribute to understanding the concept. Use the following list of words to determine the subject of the visualization ${list}`,
  size: "1024x1024",
});

  const descText = (description && (description as any).output_text) || "";
  const imageUrl = image && image.data && image.data[0] && image.data[0].url ? image.data[0].url : null;

  return { descText, imageUrl };
}
