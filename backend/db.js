
import { MongoClient } from 'mongodb';
import { readFileSync } from 'node:fs';

function readSecret(pathVariable) {
    const path = process.env[pathVariable];

    if (!path) {
        throw new Error(`Missing environment variable: ${pathVariable}`);
    }

    return readFileSync(path, 'utf8').trim();
}

const username = readSecret('MONGODB_USERNAME_FILE');
const password = readSecret('MONGODB_PASSWORD_FILE');
const dbName = process.env.DB_NAME;

if (!dbName) {
    throw new Error('Missing DB_NAME environment variable');
}

const uri =
    `mongodb://${encodeURIComponent(username)}:` +
    `${encodeURIComponent(password)}@mongodb:27017/` +
    `${encodeURIComponent(dbName)}?authSource=admin`;

const client = new MongoClient(uri);

async function connect() {
    await client.connect();

    const db = client.db(dbName);
    const todos = db.collection('todos');

    console.log('MongoDB connected successfully');

    return todos;
}

const conn = connect();

export default conn;
