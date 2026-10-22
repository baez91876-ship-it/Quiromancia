import mongoose from "mongoose";
import { BitacoraTransaccion } from "../models/bitacoraTransacciones.model.js";
import { LecturaIA } from "../models/lecturasIA.model.js";
import { MatrizNumerologica } from "../models/matricesNumerologicas.model.js";
import { PromptConfig } from "../models/promptsConfig.model.js";
import { Usuario } from "../models/usuarios.model.js";

const modelos = [
    Usuario,
    MatrizNumerologica,
    PromptConfig,
    LecturaIA,
    BitacoraTransaccion,
];

export const asegurarColecciones = async () => {
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("MongoDB no está conectado; no se pueden crear las colecciones");
    }

    for (const modelo of modelos) {
        const nombre = modelo.collection.collectionName;
        const existe = await db.listCollections({ name: nombre }, { nameOnly: true }).hasNext();
        if (!existe) {
            await db.createCollection(nombre);
            console.log(`Colección creada: ${nombre}`);
        }
    }

    // Retira el índice único anterior a "consulta", que impedía varias preguntas con la misma plantilla.
    await LecturaIA.syncIndexes();
};
