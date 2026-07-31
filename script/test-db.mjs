import 'dotenv/config';
import mongoose from 'mongoose';

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI not found");
        process.exit(1);
    }

    await mongoose.connect(uri);

    const db = mongoose.connection.db;

    // Create a collection and insert one document
    await db.collection("testCollection").insertOne({
        name: "Arpita",
        createdAt: new Date(),
    });

    console.log("Database and collection created successfully!");

    await mongoose.connection.close();
}

main();