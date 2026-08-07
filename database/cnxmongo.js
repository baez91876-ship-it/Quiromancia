import dns from "dns"
import mongoose from "mongoose"

export const cnxmongo = async () => {
    const uri = process.env.MONGODB_URI
    if (!uri) {
        throw new Error('MONGODB_URI no está definido. Agrega tu URI en el archivo .env')
    }

    const dnsServers = process.env.MONGODB_DNS_SERVERS
        ? process.env.MONGODB_DNS_SERVERS.split(',').map((server) => server.trim()).filter(Boolean)
        : ['8.8.8.8', '1.1.1.1']

    dns.setServers(dnsServers)
    console.log('Node DNS servers usados para MongoDB:', dns.getServers())

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
    })

    console.log('Conectado a MongoDB')
}