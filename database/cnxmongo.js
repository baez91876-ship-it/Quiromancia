import dns from "dns";
import mongoose from "mongoose";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectMongo = async (uri) => {
    const dnsServers = process.env.MONGODB_DNS_SERVERS
        ? process.env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean)
        : ['8.8.8.8', '1.1.1.1'];

    dns.setServers(dnsServers);
    console.log('Node DNS servers usados para MongoDB:', dns.getServers());

    return mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        family: 4,
    });
};

export const cnxmongo = async () => {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quiromancia';

    const maxRetries = 3;
    let attempt = 0;
    let lastError;

    while (attempt < maxRetries) {
        try {
            await connectMongo(uri);
            console.log('Conectado a MongoDB');
            return true;
        } catch (error) {
            lastError = error;
            attempt += 1;
            console.warn(`Intento ${attempt}/${maxRetries} fallido para MongoDB:`, error.message);
            if (attempt < maxRetries) {
                console.log('Reintentando conexión a MongoDB en 5 segundos...');
                await delay(5000);
            }
        }
    }

    console.warn('MongoDB no está disponible; la aplicación continuará en modo local sin base de datos.');
    return false;
};