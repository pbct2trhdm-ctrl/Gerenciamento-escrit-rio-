import { FinanceiroTabs } from "@/components/financeiro-tabs";
import { classeTituloPagina } from "@/lib/estilos";

export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-5xl">
      <h1 className={`${classeTituloPagina} mb-4`}>Financeiro</h1>
      <FinanceiroTabs />
      {children}
    </div>
  );
}
