import { addFileService, removeFileService } from "~/services/file";

async function addFile({ file }: { file: Express.Multer.File }) {
  const { key } = await addFileService({ file });
  return key;
}

async function removeFile({ key }: { key: string }) {
  const { key: removedKey } = await removeFileService({ key });
  return removedKey;
}

export { addFile, removeFile };
