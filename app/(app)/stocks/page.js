import StocksTable from "@/components/StocksTable";
import { getActiveStocks } from "@/lib/catalog";

export default async function StocksPage() {
  const stocks = await getActiveStocks();
  return (
    <main className="bg-grid min-h-full">
      <StocksTable stocks={stocks} />
    </main>
  );
}
