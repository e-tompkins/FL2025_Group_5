import fs from "fs";
import PDFParser from "pdf2json";

export default async function processUploadedFile(fileBuffer: Buffer | null, filePath?: fs.PathOrFileDescriptor) {
  // ensure we have a Buffer: prefer the passed buffer, otherwise read the filePath
  let buffer: Buffer;
  if (Buffer.isBuffer(fileBuffer)) {
    buffer = fileBuffer as Buffer;
  } else if (filePath) {
    buffer = await fs.promises.readFile(filePath as fs.PathLike);
  } else {
    throw new Error("No file buffer or filePath provided to processUploadedFile");
  }

  return await new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err: any) => {
      reject(err);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      resolve({ parsed: pdfData });
    });

    // start parsing the buffer (async)
    try {
      pdfParser.parseBuffer(buffer);
    } catch (err) {
      reject(err);
    }
  });
}

