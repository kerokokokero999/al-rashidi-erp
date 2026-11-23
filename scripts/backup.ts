import { Client } from "pg";
import fs from "fs";
import path from "path";

const connectionString = "postgresql://postgres.biijfzgysyjjayvzltip:AlRashidi2026@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";

async function backup() {
  const client = new Client({ connectionString });
  await client.connect();

  const tablesRes = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `);
  const tables = tablesRes.rows.map((r: { tablename: string }) => r.tablename);

  const backupData: Record<string, unknown[]> = {};

  for (const table of tables) {
    const res = await client.query(`SELECT * FROM "${table}"`);
    backupData[table] = res.rows;
    console.log(`✅ تم نسخ جدول ${table} (${res.rows.length} صف)`);
  }

  const backupDir = path.join(__dirname, "..", "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  
  const fileName = `backup-${new Date().toISOString().split("T")[0]}.json`;
  const filePath = path.join(backupDir, fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
  console.log(`\n✅ تم حفظ النسخة الاحتياطية في: ${filePath}`);

  await client.end();
}

backup().catch(console.error);