import { FinanceiroTabs } from "@/components/financeiro-tabs";

export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold mb-4">Financeiro</h1>
      <FinanceiroTabs />
      {children}
    </div>
  );
}
