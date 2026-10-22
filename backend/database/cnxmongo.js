import dns from "dns";
import mongoose from "mongoose";

export const estadoMongo = () => ({
    connected: mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState,
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectMongo = async (uri) => {
    const dnsServers = process.env.MONGODB_DNS_SERVERS
        ? process.env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean)
        : ['8.8.8.8', '1.1.1.1'];

    dns.setServers(dnsServers);
    console.log('Node DNS servers usados para MongoDB:', dns.getServers());

    return mongoose.connect(uri, {
        dbName: process.env.MONGO_DB_NAME || "NUMEROLOGIA",
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        family: 4,
    });
};

export const cnxmongo = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI no está configurada');
    }

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            await connectMongo(uri);
            console.log('Conectado a MongoDB');
            return true;
        } catch (error) {
            attempt += 1;
            const message = error instanceof Error ? error.message : String(error);
            const authenticationFailed = error?.code === 18 || /bad auth|authentication failed/i.test(message);
            console.warn(`Intento ${attempt}/${maxRetries} fallido para MongoDB:`, message);
            if (authenticationFailed) {
                console.error('Atlas rechazó la autenticación. Verifica el usuario y la contraseña del Database User, authSource=admin y que los caracteres especiales de MONGO_URI estén codificados.');
                break;
            }
            if (attempt < maxRetries) {
                console.log('Reintentando conexión a MongoDB en 5 segundos...');
                await delay(5000);
            }
        }
    }

    console.warn('MongoDB no está disponible; la aplicación continuará en modo local sin base de datos.');
    return false;
};