import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";

export async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

export async function writeFileSafe(path: string, content: string, encoding: BufferEncoding = "utf-8") {
  await ensureDir(dirname(path));
  await writeFile(path, content, { encoding });
}

