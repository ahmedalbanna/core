
'use server';
import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
// Assuming env file is at the root of the project
// and exports GOOGLE_API_KEY

const GOOGLE_API_KEY = "AIzaSyA50lI7eBJIQOmmfugv2180BXiB-Ih2nxg"
export const ai = genkit({
  plugins: [googleAI({ apiKey: GOOGLE_API_KEY })],
});
