import PDFParser from 'pdf2json';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    // 1. Create a new parser instance
    const parser = new PDFParser();

    // 2. Handle Errors
    parser.on('pdfParser_dataError', (errData: any) => {
      console.error('PDF Parser Error:', errData.parserError);
      // We resolve with empty string so the background process continues smoothly
      resolve('');
    });

    // 3. Handle Success
    parser.on('pdfParser_dataReady', () => {
      // pdf2json allows us to get the raw text content directly
      const text = parser.getRawTextContent();
      
      // Clean up the text (remove excessive newlines/spaces)
      const cleanText = (text || '')
        .replace(/\s+/g, ' ')
        .trim();
        
      resolve(cleanText);
    });

    // 4. Start Parsing
    try {
      parser.parseBuffer(buffer);
    } catch (error) {
      console.error('PDF Buffer Processing Error:', error);
      resolve('');
    }
  });
}
