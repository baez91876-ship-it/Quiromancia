import mongoose from "mongoose";

const promptsConfigSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },
    activo: { type: Boolean, default: true },
    categoria: { type: String, trim: true },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
}, {
    timestamps: true,
});

export const PromptConfig = mongoose.model("PromptConfig", promptsConfigSchema);
