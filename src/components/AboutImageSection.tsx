import { useTenant } from '@/hooks/useTenant';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

export const AboutImageSection = () => {
  const { tenant } = useTenant();
  
  const imageUrls = tenant?.about_images || [];
  const autoPlay = tenant?.about_autoplay ?? true;
  const autoPlayDelay = tenant?.about_autoplay_delay || 5000;

  // Se não houver imagens configuradas, mostra placeholder
  if (imageUrls.length === 0) {
    return (
      <div className="w-full h-80 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400">Imagem sobre nós</span>
      </div>
    );
  }

  // Se houver apenas uma imagem, renderiza diretamente
  if (imageUrls.length === 1) {
    return (
      <div className="w-full h-80 rounded-lg overflow-hidden">
        <img
          src={imageUrls[0]}
          alt="Sobre nós"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // Se houver múltiplas imagens, renderiza carrossel
  return (
    <Carousel
      opts={{ loop: true }}
      plugins={autoPlay ? [
        Autoplay({
          delay: autoPlayDelay,
          stopOnInteraction: true,
        }),
      ] : []}
      className="w-full h-80 rounded-lg overflow-hidden"
    >
      <CarouselContent>
        {imageUrls.map((url, index) => (
          <CarouselItem key={index}>
            <div className="relative w-full h-80">
              <img
                src={url}
                alt={`Sobre nós - Imagem ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};
