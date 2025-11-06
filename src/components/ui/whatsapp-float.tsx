import { MessageCircle } from "lucide-react"
import { Button } from "./button"

const WhatsAppFloat = () => {
  const phoneNumber = "5511956850046" // Formato internacional sem símbolos
  const defaultMessage = "Olá! Gostaria de agendar uma consulta através do whats Rede Bem-Estar!"
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`

  const handleWhatsAppClick = () => {
    window.open(whatsappUrl, '_blank')
  }

  return (
    <Button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center p-0"
      aria-label="Entrar em contato via WhatsApp"
    >
      <MessageCircle size={24} fill="currentColor" />
    </Button>
  )
}

export default WhatsAppFloat