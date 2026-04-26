import { useTenant } from "@/hooks/useTenant";
import HomeMedcos from "@/components/home/HomeMedcos";
import HomeRedeBemEstar from "@/components/home/HomeRedeBemEstar";

const Index = () => {
  const { tenant } = useTenant();
  // MEDCOS mantém a Home antiga; todos os demais tenants usam o novo design Rede Bem-Estar.
  if (tenant?.slug === "medcos") {
    return <HomeMedcos />;
  }
  return <HomeRedeBemEstar />;
};

export default Index;
