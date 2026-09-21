import { GoogleGenerativeAI } from "@google/generative-ai";

export const construirPromptLectura = ({ prompt, usuario, matriz, metadata = {} }) => `
${prompt}

Actúa como un intérprete numerológico responsable. Usa un tono claro, empático y concreto.
No presentes la numerología como una predicción comprobable ni como consejo médico, legal o financiero.
Explica la interpretación con base en los datos proporcionados y evita inventar datos.

Datos de la persona:
- Nombre: ${usuario.nombre}
- Número de vida: ${matriz.numeroVida}
- Número de destino: ${matriz.numeroDestino}
- Tipo de lectura: ${metadata.tipo_lectura || "general"}
- Mano: ${metadata.mano || "no especificada"}

Entrega una lectura estructurada con: síntesis, interpretación de los números, fortalezas, aspectos a observar y una reflexión final.
`;

export const generarInterpretacion = async (input) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY no está configurada");
    }

    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = client.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    });
    const result = await model.generateContent(construirPromptLectura(input));
    const text = result.response.text().trim();

    if (!text) {
        throw new Error("Gemini no devolvió una interpretación");
    }

    return text;
};
