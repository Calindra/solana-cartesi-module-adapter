import { run } from 'node:test';
import path from 'path';
import fs from 'fs/promises';

async function fromDir(startPath: string, filter: RegExp): Promise<string[]> {
  const arrayFromFiles = await fs.readdir(startPath, { withFileTypes: true });

  const { files, dir } = arrayFromFiles.reduce<{
    files: string[];
    dir: string[];
  }>(
    (acc, item) => {
      const fullPath = path.join(startPath, item.name);

      if (item.isFile() && filter.test(item.name)) {
        acc.files.push(fullPath);
      }

      if (item.isDirectory()) {
        acc.dir.push(fullPath);
      }

      return acc;
    },
    { files: [], dir: [] }
  );

  const subfiles = await Promise.all(
    dir.map((dirPath) => fromDir(dirPath, filter))
  );

  const subfilesFlat = subfiles.flat();
  const filesWithSubfiles = [...files, ...subfilesFlat];

  return filesWithSubfiles;
}

const filter = /^.+\.test\.ts$/g;
const pathForTest = path.resolve('./src');

const files = await fromDir(pathForTest, filter);

run({
  concurrency: true,
  files,
  timeout: 10000,
}).pipe(process.stdout);
