import { mongoose } from "mongoose";

export const cnxmongo = () => {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log('Conectado a MongoDB');
        })
        .catch((error) => {
            console.error('Error al conectar a MongoDB:', error);
        });
};