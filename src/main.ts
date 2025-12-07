import { parseTransactionsUseCase } from "./application/use-cases/parse-transactions.ts";
import { PDFParserAdapter } from "./infraestructure/adapters/pdf-parser.ts";

export default async function main() {
  const transactions = await parseTransactionsUseCase(
    { PDFParser: PDFParserAdapter },
    "./data/Febrero.pdf"
  );

  console.table(transactions);
}

main();
