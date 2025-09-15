import { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useSystemConfig } from '@/hooks/useSystemConfig';

export const HeroCarousel = () => {
  const { getConfig, loading } = useSystemConfig(['homepage']);
  const [isCarousel, setIsCarousel] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!loading) {
      const carouselMode = getConfig('homepage', 'hero_carousel_mode', false);
      const imageUrls = getConfig('homepage', 'hero_images', []);
      
      setIsCarousel(carouselMode);
      setImages(Array.isArray(imageUrls) ? imageUrls : [imageUrls].filter(Boolean));
    }
  }, [loading, getConfig]);

  if (loading || images.length === 0) {
    return (
      <div className="relative">
        <img 
          src="https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/homepage/Hero.png" 
          alt="Profissional de saúde mental oferecendo cuidado e acolhimento" 
          className="w-full h-80 object-cover rounded-lg" 
          loading="lazy" 
        />
      </div>
    );
  }

  if (!isCarousel || images.length === 1) {
    return (
      <div className="relative">
        <img 
          src={images[0]} 
          alt="Profissional de saúde mental oferecendo cuidado e acolhimento" 
          className="w-full h-80 object-cover rounded-lg" 
          loading="lazy" 
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <Carousel className="w-full" opts={{ align: "start", loop: true }}>
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <img 
                src={image} 
                alt={`Profissional de saúde mental ${index + 1}`} 
                className="w-full h-80 object-cover rounded-lg" 
                loading="lazy" 
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  );
};