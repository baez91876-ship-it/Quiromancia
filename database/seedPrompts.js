import { PromptConfig } from "../models/promptsConfig.model.js";

const defaultPrompt = {
    nombre: "Lectura numerológica general",
    prompt: [
        "Interpreta la matriz numerológica proporcionada y redacta una lectura general, clara y personalizada.",
        "Explica cómo se relacionan el número de vida y el número de destino con la interpretación.",
        "Mantén un tono respetuoso, cálido y no determinista; presenta la numerología como una herramienta simbólica de reflexión.",
        "No inventes información personal ni presentes predicciones como hechos.",
    ].join(" "),
    descripcion: "Lectura general basada en la matriz numerológica personal.",
    categoria: "general",
    tipo_lectura: "general",
    activo: true,
};

export const asegurarPromptPredeterminado = async () => {
    await PromptConfig.updateOne(
        { nombre: defaultPrompt.nombre, tipo_lectura: defaultPrompt.tipo_lectura },
        { $setOnInsert: defaultPrompt },
        { upsert: true, runValidators: true }
    );
};
