require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No GEMINI_API_KEY found');
    return;
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // There is no direct listModels on GoogleGenerativeAI, but we can do a fetch
    // Or we can try to initialize with gemini-2.5-flash and test it
    console.log('Testing gemini-2.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Hi');
    console.log('Gemini 2.5 response:', result.response.text());
  } catch (err) {
    console.error('Gemini 2.5 error:', err.message);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('Testing gemini-1.5-pro...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent('Hi');
    console.log('Gemini 1.5 Pro response:', result.response.text());
  } catch (err) {
    console.error('Gemini 1.5 Pro error:', err.message);
  }
}

run();
