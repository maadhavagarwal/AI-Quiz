import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function extractTextFromFile(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.txt') {
      return extractTextFromTxt(filePath);
    } else if (ext === '.pdf') {
      return await extractTextFromPdf(filePath);
    } else if (ext === '.docx' || ext === '.doc') {
      return await extractTextFromDocx(filePath);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
  }
}

function extractTextFromTxt(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading text file:', error);
    throw new Error('Failed to read text file');
  }
}

async function extractTextFromPdf(filePath) {
  try {
    let pdfParseModule;
    try {
      pdfParseModule = await import('pdf-parse');
    } catch {
      // Fallback for older/newer package layouts.
      pdfParseModule = await import('pdf-parse/legacy/index.js');
    }

    const pdfParse = pdfParseModule.default || pdfParseModule;
    if (typeof pdfParse !== 'function') {
      throw new Error('pdf-parse module did not export a parser function');
    }

    const fileBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(fileBuffer);
    return data.text;
  } catch (error) {
    console.warn('Warning: pdf-parse not available or error reading PDF:', error.message);
    throw new Error('PDF extraction not available. Please upload TXT files instead.');
  }
}

async function extractTextFromDocx(filePath) {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.warn('Warning: mammoth not available:', error.message);
    throw new Error('DOCX extraction not available. Please upload TXT files instead.');
  }
}

export function validateTextLength(text) {
  const minLength = 100;
  const maxLength = 50000;
  
  if (text.length < minLength) {
    throw new Error('Text is too short. Minimum 100 characters required.');
  }
  
  if (text.length > maxLength) {
    throw new Error('Text is too long. Maximum 50000 characters allowed.');
  }
  
  return true;
}

export function cleanText(text) {
  // Remove extra whitespace and normalize
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .substring(0, 50000); // Limit to 50000 characters
}
