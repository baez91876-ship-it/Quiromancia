import mongoose from "mongoose";

const lecturaIASchema = new mongoose.Schema({
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    prompt_usado_id: { type: mongoose.Schema.Types.ObjectId, ref: "PromptConfig", required: true },
    fecha: { type: Date, default: Date.now },
    respuesta: { type: String, trim: true },
    analisis: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    resultado: { type: String, trim: true },
}, {
    timestamps: true,
});

export const LecturaIA = mongoose.model("LecturaIA", lecturaIASchema);
