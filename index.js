import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ ADVERTENCIA: No se encontró la variable GEMINI_API_KEY.");
}

const genAI = new GoogleGenerativeAI(apiKey || '');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat-stream', async (req, res) => {
  try {
    const { message, targetLanguage, gender } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'El mensaje es obligatorio' });
    }

    const tutorName = gender === 'female' ? 'Penny' : 'Pingu';
    const tutorRole = gender === 'female' ? 'profesora' : 'profesor';

    const systemInstruction = `Eres ${tutorName}, una simpática y paciente ${tutorRole} pingüina de idiomas para estudiantes.
Tu objetivo es enseñar el idioma "${targetLanguage || 'inglés'}".
Instrucciones clave:
1. Responde SIEMPRE en un tono cercano, pedagógico y motivador.
2. Si el alumno comete un error en su mensaje, corrige de forma suave y amable su gramática o vocabulario antes de responder.
3. Mantén las respuestas relativamente cortas y directas para facilitar la lectura y pronunciación.
4. Anima siempre al alumno a seguir practicando con preguntas al final.`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      systemInstruction: systemInstruction
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const resultStream = await model.generateContentStream(message);

    for await (const chunk of resultStream.stream) {
      const chunkText = chunk.text();
      res.write(chunkText);
    }

    res.end();
  } catch (error) {
    console.error('Error en streaming con Gemini:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error interno del servidor al procesar la respuesta.' });
    } else {
      res.end();
    }
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor activo corriendo en el puerto ${PORT}`);
});
