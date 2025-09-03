import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const Footer = () => {
  const links = {
    useful: ["Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum"],
    navigation: ["Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum", "Lorem Ipsum"]
  };
  return <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-sm opacity-80 mb-4">
              Nunc imperdiet odio et urna dign tellus, sit amet sagittis ex quis.
            </p>
            <div className="flex gap-2">
              <Input placeholder="E-mail" className="bg-transparent border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60" />
              <Button variant="accent" size="sm">
                →
              </Button>
            </div>
          </div>

          {/* Links Úteis */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Links úteis</h3>
            <ul className="space-y-2">
              {links.useful.map((link, index) => <li key={index}>
                  <a href="#" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                    {link}
                  </a>
                </li>)}
            </ul>
          </div>

          {/* Navegação */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Navegação</h3>
            <ul className="space-y-2">
              {links.navigation.map((link, index) => <li key={index}>
                  <a href="#" className="text-sm opacity-80 hover:opacity-100 transition-opacity">
                    {link}
                  </a>
                </li>)}
            </ul>
          </div>

          {/* Contato */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <div className="space-y-2 text-sm opacity-80">
              <p>📍 R. Joaquim Távora, 1240 - Vila Mariana, São Paulo - SP, 04015-013</p>
              <p>CNPJ: 12.345.678/0001-90, Brasil</p>
              <p>📞 (11) 94799-4163</p>
              <p>✉️ alopsi.host@gmail.com</p>
            </div>
          </div>

          {/* Instagram */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Instagram</h3>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({
              length: 6
            }).map((_, index) => <div key={index} className="aspect-square bg-teal rounded-md"></div>)}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm opacity-60">Copyright © Alô, Psi! | Todos os direitos reservados</p>
          <div className="w-16 h-16 bg-accent rounded-full mt-4 md:mt-0"></div>
        </div>
      </div>
    </footer>;
};
export default Footer;