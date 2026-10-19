import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.8-flash";
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

export const geminiConfigured = Boolean(geminiApiKey);
export const geminiClient = geminiConfigured
    ? new GoogleGenAI({ apiKey: geminiApiKey })
    : null;
