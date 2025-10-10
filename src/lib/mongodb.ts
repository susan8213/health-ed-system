import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

// Main MongoDB connection for TCM clinic
const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// LINE Bot MongoDB connection
let lineBotClient: MongoClient;
let lineBotClientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
    _lineBotClientPromise?: Promise<MongoClient>;
  };

  // TCM clinic database connection
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;

  // LINE Bot database connection
  if (!globalWithMongo._lineBotClientPromise) {
    const lineBotUri = process.env.LINEBOT_MONGODB_URI || uri; // Fall back to main URI if not specified
    lineBotClient = new MongoClient(lineBotUri, options);
    globalWithMongo._lineBotClientPromise = lineBotClient.connect();
  }
  lineBotClientPromise = globalWithMongo._lineBotClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();

  const lineBotUri = process.env.LINEBOT_MONGODB_URI || uri;
  lineBotClient = new MongoClient(lineBotUri, options);
  lineBotClientPromise = lineBotClient.connect();
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
}

export async function getLineBotDatabase(): Promise<Db> {
  const client = await lineBotClientPromise;
  const dbName = process.env.LINEBOT_MONGODB_DB || 'linebot';
  return client.db(dbName);
}

export default clientPromise;