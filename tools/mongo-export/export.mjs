import { MongoClient, ReadPreference, BSON } from "mongodb";
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("Set MONGO_URI before running");
  process.exit(1);
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", ".migration", "raw");
await mkdir(outDir, { recursive: true });

const client = new MongoClient(uri, {
  readPreference: ReadPreference.SECONDARY_PREFERRED,
  retryWrites: false,
  appName: "allship-ai-readonly-export",
});

await client.connect();
const summary = {};

try {
  const { databases } = await client.db().admin().listDatabases({ nameOnly: true });
  const userDbs = databases.map((d) => d.name).filter((n) => !["admin", "local", "config"].includes(n));

  for (const dbName of userDbs) {
    const db = client.db(dbName);
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    summary[dbName] = {};
    await mkdir(join(outDir, dbName), { recursive: true });

    for (const { name } of collections) {
      const docs = await db.collection(name).find({}).toArray();
      await writeFile(join(outDir, dbName, `${name}.json`), BSON.EJSON.stringify(docs, null, 2, { relaxed: false }));
      summary[dbName][name] = docs.length;
      console.log(`${dbName}.${name}: ${docs.length}`);
    }
  }

  await writeFile(join(outDir, "_summary.json"), JSON.stringify({ exportedAt: new Date().toISOString(), summary }, null, 2));
} finally {
  await client.close();
}
