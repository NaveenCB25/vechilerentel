import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const projectEnvPath = path.resolve(projectRoot, ".env");
const serverEnvPath = path.resolve(projectRoot, "server", ".env");

dotenv.config({ path: projectEnvPath, quiet: true });

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath, override: false, quiet: true });
}
