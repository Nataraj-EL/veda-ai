import { PDFParse } from "pdf-parse";
import { AppError } from "./app-error.js";
import { logger } from "./logger.js";

/**
 * Extracts and cleans text from a PDF buffer.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  let parser: PDFParse | null = null;
  try {
    // Instantiate the modern PDFParse class with our PDF buffer converted to Uint8Array
    parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    const text = result.text || "";
    
    // Clean whitespace while preserving general formatting
    const cleanedText = text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n\n")
      .trim();

    return cleanedText;
  } catch (error) {
    logger.error({ err: error }, "Error parsing PDF using PDFParse class");
    throw new AppError("Failed to extract text from PDF", 400, "MATERIAL_EXTRACTION_FAILED");
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (err) {
        logger.debug({ err }, "Error destroying PDFParse instance");
      }
    }
  }
}
