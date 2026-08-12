import { MongoClient, type Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    var mongoClientCache: {
        client: MongoClient | null;
        promise: Promise<MongoClient> | null;
    };
}

let cached = global.mongoClientCache;

if (!cached) {
    cached = global.mongoClientCache = { client: null, promise: null };
}

export const getMongoClient = async (): Promise<MongoClient> => {
    if (!MONGODB_URI) throw new Error('MONGODB_URI must be set within .env');

    if (cached.client) return cached.client;

    if (!cached.promise) {
        cached.promise = new MongoClient(MONGODB_URI).connect();
    }

    try {
        cached.client = await cached.promise;
    } catch (err) {
        cached.promise = null;
        throw err;
    }

    return cached.client;
};

export const getDb = async (): Promise<Db> => {
    const client = await getMongoClient();
    return client.db();
};
