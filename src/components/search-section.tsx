import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

const SearchSection = () => {
  return (
    <section className="bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">
            Encontre o melhor profissional para cuidar da sua saúde mental
          </h2>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  🔵 Especialidade Desejada
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="psicologia">Psicologia</SelectItem>
                    <SelectItem value="psiquiatria">Psiquiatria</SelectItem>
                    <SelectItem value="terapia">Terapia</SelectItem>
                    <SelectItem value="coaching">Coaching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  🔵 Serviços
                </label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de atendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  🔵 Nome do Profissional
                </label>
                <div className="relative">
                  <Input 
                    placeholder="Digite o nome do profissional"
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                </div>
              </div>
            </div>
            
            <Button variant="accent" className="w-full md:w-auto px-8">
              Buscar Profissionais
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SearchSection