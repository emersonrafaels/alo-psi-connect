export const BUDDY_WHATSAPP_NUMBER = "5511937074332";
export const buddyWhatsAppUrl = (text = "Olá! Quero conhecer a Rede Bem-Estar.") =>
  `https://wa.me/${BUDDY_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
