import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fechaNacimiento: { type: Date },
    genero: { type: String, enum: ["M", "F", "Otro"], default: "Otro" },
    telefono: { type: String, trim: true },
}, {
    timestamps: true,
});

export const Usuario = mongoose.model("Usuario", usuarioSchema);
