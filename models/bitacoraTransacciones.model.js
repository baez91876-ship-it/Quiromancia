import mongoose from "mongoose";

const bitacoraTransaccionSchema = new mongoose.Schema({
    usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    lectura_id: { type: mongoose.Schema.Types.ObjectId, ref: "LecturaIA" },
    tipo: { type: String, required: true, trim: true },
    monto: { type: Number, default: 0 },
    estado: { type: String, default: "pendiente", trim: true },
    detalles: { type: String, trim: true },
    fecha: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

export const BitacoraTransaccion = mongoose.model("BitacoraTransaccion", bitacoraTransaccionSchema);
