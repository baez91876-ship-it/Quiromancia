import dns from "dns";
import mongoose from "mongoose";

export const cnxmongo = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error('La variable de entorno MONGO_URI no está definida. Agrega tu URI en el archivo .env');
    }

    const dnsServers = process.env.MONGODB_DNS_SERVERS
        ? process.env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean)
        : ['8.8.8.8', '1.1.1.1'];

    dns.setServers(dnsServers);
    console.log('Node DNS servers usados para MongoDB:', dns.getServers());

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        family: 4,
    });

    console.log('Conectado a MongoDB');
};