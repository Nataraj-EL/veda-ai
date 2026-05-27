import fs from "fs";
import path from "path";
import { extractTextFromPdf } from "./pdf-extractor.js";

async function runTest() {
  const biologyPath = path.resolve(process.cwd(), "test-docs/biology-photosynthesis.pdf");
  const historyPath = path.resolve(process.cwd(), "test-docs/history-french-revolution.pdf");
  
  console.log("Reading Biology PDF...");
  const biologyBuffer = fs.readFileSync(biologyPath);
  const biologyText = await extractTextFromPdf(biologyBuffer);
  console.log(`Extracted Biology text length: ${biologyText.length}`);
  console.log("--- Biology Preview ---");
  console.log(biologyText.slice(0, 300));
  console.log("-----------------------\n");
  
  console.log("Reading History PDF...");
  const historyBuffer = fs.readFileSync(historyPath);
  const historyText = await extractTextFromPdf(historyBuffer);
  console.log(`Extracted History text length: ${historyText.length}`);
  console.log("--- History Preview ---");
  console.log(historyText.slice(0, 300));
  console.log("-----------------------");
}

runTest().catch(console.error);
