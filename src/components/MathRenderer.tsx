import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  text: string;
}

/**
 * Pre-processes and cleans raw text from the AI to format formulas,
 * fix broken fractions, remove stray Unicode symbols, and eliminate consecutive duplicates.
 */
export function sanitizeMathText(text: string): string {
  if (!text) return "";

  // 1. Remove malformed Unicode / invisible characters
  let cleaned = text.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "");

  // 2. Remove stray slash lines or isolated backslashes/pipe symbols on their own lines
  cleaned = cleaned
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed === "/" || trimmed === "\\" || trimmed === "|" || trimmed === "---") {
        return "";
      }
      return line;
    })
    .join("\n");

  // 2.5 Deduplicate consecutive mathematical tokens, variables, decimals, and glitched parenthetical expressions
  // e.g. Precision (P)(P): 0.80.8 -> Precision (P): 0.8
  cleaned = cleaned.replace(/\b([a-zA-Z])\s*\1\b/g, "$1"); // Deduplicate adjacent letters like P P -> P
  cleaned = cleaned.replace(/\(([a-zA-Z])\)\(\1\)/g, "($1)"); // (P)(P) -> (P)
  cleaned = cleaned.replace(/\b([0-9]+\.[0-9]+)\1\b/g, "$1"); // 0.80.8 -> 0.8, 0.70.7 -> 0.7
  cleaned = cleaned.replace(/P\(sentence\)\s*=\s*P\(sentence\)\s*=/g, "P(sentence)=");
  cleaned = cleaned.replace(/Precision\s*\(P\)\(P\):\s*0\.80\.8/gi, "Precision (P): 0.8");
  cleaned = cleaned.replace(/Recall\s*\(R\)\(R\):\s*0\.70\.7/gi, "Recall (R): 0.7");

  // 3. Proper Formula Conversions (Smart parsing of CBSE/ICSE mathematical notations)
  
  // Example A: P(sentence)=P(w1)×P(w2)×⋯×P(wn) -> \[ P(\text{sentence}) = P(w_1) \times P(w_2) \times \cdots \times P(w_n) \]
  cleaned = cleaned.replace(
    /P\(sentence\)\s*=\s*P\(w1\)\s*[×*]\s*P\(w2\)\s*[×*]\s*[⋯\.\s]+\s*[×*]\s*P\(wn\)/g,
    "\\[ P(\\text{sentence}) = P(w_1) \\times P(w_2) \\times \\cdots \\times P(w_n) \\]"
  );
  // General fallback for w1/wn variables to subscript formats w_1/w_n in w-indexed math
  cleaned = cleaned.replace(/\b([a-zA-Z])([0-9n])\b/g, "$1_$2");
  
  // Re-verify probability sentence mapping
  cleaned = cleaned.replace(
    /P\(sentence\)\s*=\s*P\(w_1\)\s*[×*]\s*P\(w_2\)\s*[×*]\s*[⋯\.\s]+\s*[×*]\s*P\(w_n\)/g,
    "\\[ P(\\text{sentence}) = P(w_1) \\times P(w_2) \\times \\cdots \\times P(w_n) \\]"
  );

  // Example B: Accuracy=9001000 -> \[ \text{Accuracy} = \frac{900}{1000} \]
  cleaned = cleaned.replace(
    /Accuracy\s*=\s*9001000/g,
    "\\[ \\text{Accuracy} = \\frac{900}{1000} \\]"
  );
  cleaned = cleaned.replace(
    /Accuracy\s*=\s*([0-9]+)\s*[\/\\]+\s*([0-9]+)/gi,
    "\\[ \\text{Accuracy} = \\frac{$1}{$2} \\]"
  );

  // Example C: F1=2×P×RP+R -> \[ F_1 = \frac{2 \times P \times R}{P + R} \]
  cleaned = cleaned.replace(
    /F1\s*=\s*2\s*[×*]\s*P\s*[×*]\s*R\s*P\s*\+\s*R/g,
    "\\[ F_1 = \\frac{2 \\times P \\times R}{P + R} \\]"
  );
  // General F1 formula with standard division
  cleaned = cleaned.replace(
    /F1\s*=\s*2\s*[×*]\s*P\s*[×*]\s*R\s*[\/\\]+\s*\(?\s*P\s*\+\s*R\s*\)?/gi,
    "\\[ F_1 = \\frac{2 \\times P \\times R}{P + R} \\]"
  );

  // Convert raw fraction text patterns like "X = A/B" or "Ratio = A/B" to standard \frac
  cleaned = cleaned.replace(
    /\b(Ratio|Precision|Recall|F1|Accuracy|Score|P)\s*=\s*([a-zA-Z0-9_]+)\s*[\/\\]+\s*([a-zA-Z0-9_]+)\b/g,
    "\\[ $1 = \\frac{$2}{$3} \\]"
  );

  // 4. Removes duplicated equations appearing consecutively (Deduplicate identical lines/blocks)
  const lines = cleaned.split("\n");
  const uniqueLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const current = lines[i].trim();
    if (current === "") {
      uniqueLines.push("");
      continue;
    }
    let isDup = false;
    for (let j = uniqueLines.length - 1; j >= 0; j--) {
      if (uniqueLines[j].trim() !== "") {
        if (uniqueLines[j].trim() === current) {
          isDup = true;
        }
        break;
      }
    }
    if (!isDup) {
      uniqueLines.push(lines[i]);
    }
  }
  cleaned = uniqueLines.join("\n");

  // 5. Removes repeated "Final Answer" equation blocks or consecutive duplicates
  cleaned = cleaned.replace(/(\\\[[\s\S]*?\\\])\s*\1/g, "$1");
  cleaned = cleaned.replace(/(\$\$[\s\S]*?\$\$)\s*\1/g, "$1");
  cleaned = cleaned.replace(/(Final\s+Answer:\s*)\1/gi, "$1");

  return cleaned;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text }) => {
  if (!text) return null;

  // Run sanitization preprocessing first
  const sanitizedText = sanitizeMathText(text);

  // Regex to split by:
  // 1. Block math: \[ ... \] or $$ ... $$
  // 2. Inline math: \( ... \) or $ ... $
  const tokenRegex = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\\$\\$[\\s\\S]*?\\$\\$|\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g;
  const parts = sanitizedText.split(tokenRegex);

  return (
    <>
      {parts.map((part, index) => {
        const isBlockMath =
          (part.startsWith("\\[") && part.endsWith("\\]")) ||
          (part.startsWith("$$") && part.endsWith("$$"));
          
        const isInlineMath =
          (part.startsWith("\\(") && part.endsWith("\\)")) ||
          (part.startsWith("$") && part.endsWith("$"));

        if (isBlockMath) {
          let math = "";
          if (part.startsWith("\\[") && part.endsWith("\\]")) {
            math = part.slice(2, -2).trim();
          } else if (part.startsWith("$$") && part.endsWith("$$")) {
            math = part.slice(2, -2).trim();
          }

          try {
            const html = katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
              trust: true,
            });
            return (
              <span
                key={index}
                className="block my-2 overflow-x-auto scrollbar-thin max-w-full text-center align-middle"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <code key={index} className="block text-red-500 my-1">{part}</code>;
          }
        } else if (isInlineMath) {
          let math = "";
          if (part.startsWith("\\(") && part.endsWith("\\)")) {
            math = part.slice(2, -2).trim();
          } else if (part.startsWith("$") && part.endsWith("$")) {
            math = part.slice(1, -1).trim();
          }

          try {
            const html = katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
              trust: true,
            });
            return (
              <span
                key={index}
                className="inline-block align-middle px-0.5"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <code key={index} className="text-red-500">{part}</code>;
          }
        } else {
          // Replace newlines with <br /> for nice multiline text representation if it contains them
          const textLines = part.split("\n");
          return (
            <React.Fragment key={index}>
              {textLines.map((line, lIdx) => (
                <React.Fragment key={lIdx}>
                  {line}
                  {lIdx < textLines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        }
      })}
    </>
  );
};
