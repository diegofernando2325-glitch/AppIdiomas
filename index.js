import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const apiKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6IIZqwxpwGm7kQDnO8BBki87IDfV8PFEQTX-JsmCW50DA';
const ai = new GoogleGenAI({ apiKey });

app.post('/api/chat-stream', async (req, res) => {
  try {
    const { message, tutor, language, appLanguage, currentDay } = req.body;

    const isPenny = (tutor === 'Penny');
    const personality = isPenny
      ? "Eres Penny, una tutora pingüina hiperactiva, dulce, divertida y motivadora. Te apasiona el reto de 30 días."
      : "Eres Pingu, un tutor pingüino gamer, gracioso y competitivo. Tratas cada día como una misión de videojuego.";

    let dayLevel = "Principiante básico";
    if (currentDay > 10 && currentDay <= 20) dayLevel = "Intermedio fluido";
    if (currentDay > 20) dayLevel = "Avanzado y nativo";

    const systemInstruction = `${personality} 
    El estudiante habla el idioma nativo: "${appLanguage || 'Español'}".
    Su objetivo es aprender: "${language || 'Inglés'}".
    DÍA ACTUAL DEL RETO: Día ${currentDay || 1} de 30 (Nivel: ${dayLevel}).

    Reglas del Reto Diario:
    1. Responde de forma muy breve (2 frases máximo) e interactiva.
    2. Da un elogio estilo juego e introduce 2 palabras clave en ${language}.
    3. Haz una pregunta práctica en ${language} para que complete su misión del día.
    4. Jamás menciones ropa, accesorios, lazo, auriculares ni emoticonos descriptivos.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message || '¡Hola!',
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            correction: { type: Type.STRING, nullable: true },
            emotion: { type: Type.STRING },
            xpEarned: { type: Type.INTEGER }
          },
          required: ['reply', 'emotion', 'xpEarned']
        }
      }
    });

    const data = JSON.parse(response.text);

    res.json({
      reply: data.reply || '¡Excelente avance en tu reto diario!',
      correction: data.correction || null,
      emotion: data.emotion || 'happy',
      xpEarned: data.xpEarned || 20
    });

  } catch (error) {
    console.error('--- ERROR EN EL SERVIDOR ---', error);
    res.status(500).json({
      reply: '¡Ups! Error de conexión. ¿Me repites?',
      emotion: 'thinking',
      xpEarned: 0
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Pingüi PRO activo en http://localhost:${PORT}`);
});