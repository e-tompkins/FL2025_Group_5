export default function extractWordsFromPDF(pdfData: any): string[] {
  const words: string[] = [];
  const pages = pdfData?.parsed?.Pages;
  if (!pages) return words;

  const safeDecode = (s: any) => {
    if (typeof s !== "string") return "";
    try {
      return decodeURIComponent(s);
    } catch {
      const sanitized = s.replace(/%(?![0-9A-Fa-f]{2})/g, "%25");
      try {
        return decodeURIComponent(sanitized);
      } catch {
        return s;
      }
    }
  };

  // Space-based merge:
  // - Sort text items by vertical (y) then horizontal (x) position
  // - Walk each character of each text item in order
  // - Any whitespace character acts as a word boundary; otherwise append to current word
  pages.forEach((page: any) => {
    const texts = (page.Texts || [])
      .map((t: any) => {
        const txt = (t.R || []).map((r: any) => safeDecode(r.T)).join("");
        const x = typeof t.x === "number" ? t.x : parseFloat(t.x || "0");
        const y = typeof t.y === "number" ? t.y : parseFloat(t.y || "0");
        return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? 0 : y, text: txt };
      })
      .filter((i: any) => (i.text || "").length > 0)
      .sort((a: any, b: any) => (a.y - b.y) || (a.x - b.x));

    let current = "";
    for (const item of texts) {
      // iterate characters so explicit spaces within a text item act as separators
      for (const ch of item.text) {
        if (/\s/.test(ch)) {
          if (current.length) {
            words.push(current);
            current = "";
          }
        } else {
          current += ch;
        }
      }
      // do NOT insert implicit spaces between adjacent items here — we only split on real space chars
    }
    if (current.length) {
      words.push(current);
      current = "";
    }
  });


  return NLP(words);
}

function NLP(words: string[]): string[] {
  const stopWords = new Set([
    "a","an","the","and","or","but","if","then","else","when","while","so","because",
    "of","to","in","on","for","with","as","is","are","was","were","be","been","being",
    "at","by","from","that","this","these","those","it","its","they","them","their",
    "he","she","his","her","you","your","i","we","us","our","not","no","yes","can",
    "could","would","should","may","might","will","shall","do","does","did","have","has","had",
    "which","what","who","whom","whose","how","about","into","over","under","between","among", "-", "there"
  ]);

  const counts = new Map<string, number>();

  for (const w of words) {
    if (!w) continue;
    // normalize: lowercase, remove surrounding punctuation but keep letters/numbers/apostrophes/hyphens
    let normalized: string;
    try {
      normalized = w.toLowerCase().replace(/[^\p{L}\p{N}'-]+/gu, "");
    } catch {
      // fallback for environments without \p{L}
      normalized = w.toLowerCase().replace(/[^A-Za-z0-9'-]+/g, "");
    }
    normalized = normalized.trim();
    if (!normalized) continue;
    if (stopWords.has(normalized)) continue;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([word]) => word);
}
