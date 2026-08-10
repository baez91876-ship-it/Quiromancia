import mongoose from "mongoose";

const matrizNumerologicaSchema = new mongoose.Schema({
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    fecha: { type: Date, default: Date.now },
    numeroVida: { type: Number, required: true },
    numeroDestino: { type: Number, required: true },
    descripcion: { type: String, trim: true },
    resultado: { type: String, trim: true },
}, {
    timestamps: true,
});

export const MatrizNumerologica = mongoose.model("MatrizNumerologica", matrizNumerologicaSchema);
