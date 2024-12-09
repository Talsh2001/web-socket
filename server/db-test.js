const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://tomq5555:Talsh7410@cluster0.c3lnb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

async function testConnection() {
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();
        console.log("Connected to the database successfully!");

        // Perform a simple operation, like listing the databases
        const databases = await client.db().admin().listDatabases();
        console.log("Databases:");
        databases.databases.forEach(db => console.log(` - ${db.name}`));
    } catch (error) {
        console.error("Error connecting to the database:", error);
    } finally {
        // Close the connection
        await client.close();
    }
}

testConnection();
