import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

const BIOLOGY_HTML = `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
    h1 { color: #2e7d32; }
    h2 { color: #388e3c; }
  </style>
</head>
<body>
  <h1>Biology Study Guide: Photosynthesis</h1>
  <p>Photosynthesis is the process used by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy.</p>
  
  <h2>The Chloroplast</h2>
  <p>Photosynthesis takes place inside organelles called <strong>chloroplasts</strong>. Chloroplasts contain a green pigment called <strong>chlorophyll</strong>, which absorbs light energy.</p>
  
  <h2>Two Stages of Photosynthesis</h2>
  <p>Photosynthesis occurs in two distinct stages:</p>
  <ul>
    <li><strong>Light-dependent Reactions:</strong> These reactions occur in the thylakoid membranes and require direct light energy. Water molecules are split to release oxygen gas, generating ATP and NADPH.</li>
    <li><strong>Light-independent Reactions (Calvin Cycle):</strong> These reactions occur in the stroma and do not require light. They use ATP and NADPH from the light-dependent reactions to fix carbon dioxide into glucose.</li>
  </ul>
  
  <h2>Chemical Equation</h2>
  <p>The balanced chemical equation for photosynthesis is:</p>
  <pre>6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2</pre>
</body>
</html>
`;

const HISTORY_HTML = `
<html>
<head>
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; padding: 20px; }
    h1 { color: #b71c1c; }
    h2 { color: #d32f2f; }
  </style>
</head>
<body>
  <h1>History Study Notes: The French Revolution</h1>
  <p>The French Revolution was a period of radical political and social change in France that began in 1789 and ended in 1799.</p>
  
  <h2>Causes of the Revolution</h2>
  <p>Key causes included social inequality (the Three Estates system), severe financial crisis due to war debts, and high taxes on the Third Estate (peasants and bourgeoisie) while the First and Second Estates (clergy and nobility) enjoyed tax exemptions.</p>
  
  <h2>The Storming of the Bastille</h2>
  <p>On <strong>July 14, 1789</strong>, an armed mob of Parisian revolutionaries stormed the <strong>Bastille</strong>, a medieval fortress and political prison representing royal tyranny. This event marked the beginning of the popular uprising.</p>
  
  <h2>The Reign of Terror</h2>
  <p>Between 1793 and 1794, the Committee of Public Safety, led by <strong>Maximilien Robespierre</strong>, initiated the <strong>Reign of Terror</strong>. During this phase, thousands of suspected counter-revolutionaries were executed using the guillotine.</p>
</body>
</html>
`;

async function generatePdf(html: string, filename: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html);
  
  const destDir = path.resolve(process.cwd(), "test-docs");
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
  }
  
  const destPath = path.join(destDir, filename);
  await page.pdf({
    path: destPath,
    format: "A4",
    printBackground: true,
  });
  
  await browser.close();
  console.log(`Generated test PDF at: ${destPath}`);
}

async function main() {
  try {
    await generatePdf(BIOLOGY_HTML, "biology-photosynthesis.pdf");
    await generatePdf(HISTORY_HTML, "history-french-revolution.pdf");
  } catch (err) {
    console.error("Error generating PDFs:", err);
  }
}

main();
