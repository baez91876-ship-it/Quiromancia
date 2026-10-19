import mongoose from "mongoose";

const lecturaIASchema = new mongoose.Schema({
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    prompt_usado_id: { type: mongoose.Schema.Types.ObjectId, ref: "PromptConfig", required: true },
    prompt_actualizado_en: { type: Date, required: true },
    matriz_id: { type: mongoose.Schema.Types.ObjectId, ref: "MatrizNumerologica", required: true },
    matriz_actualizada_en: { type: Date, required: true },
    fecha: { type: Date, default: Date.now },
    respuesta: { type: String, trim: true, required: true },
    analisis: { type: String, trim: true, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    resultado: { type: String, trim: true, required: true },
}, {
    timestamps: true,
});

lecturaIASchema.index(
    {
        usuario_id: 1,
        prompt_usado_id: 1,
        prompt_actualizado_en: 1,
        matriz_id: 1,
        matriz_actualizada_en: 1,
    },
    {
        unique: true,
        partialFilterExpression: { matriz_id: { $exists: true } },
    }
);

export const LecturaIA = mongoose.model("LecturaIA", lecturaIASchema);
