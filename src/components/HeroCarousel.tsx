import { useState, useEffect, useMemo } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useSystemConfig } from '@/hooks/useSystemConfig';

// Helper function to convert S3 URLs to HTTPS format
const convertS3ToHttps = (url: string): string => {
  if (url.startsWith('s3://')) {
    // Convert s3://bucket-name/path to https://bucket-name.s3.us-east-1.amazonaws.com/path
    const s3Match = url.match(/^s3:\/\/([^\/]+)\/(.+)$/);
    if (s3Match) {
      const [, bucket, path] = s3Match;
      return `https://${bucket}.s3.us-east-1.amazonaws.com/${path}`;
    }
  }
  return url;
};

export const HeroCarousel = () => {
  const { getConfig, loading } = useSystemConfig(['homepage']);

  const { isCarousel, images } = useMemo(() => {
    if (loading) return { isCarousel: false, images: [] };
    
    const carouselMode = getConfig('homepage', 'hero_carousel_mode', false);
    const imageUrls = getConfig('homepage', 'hero_images', []);
    
    const processedImages = Array.isArray(imageUrls) 
      ? imageUrls.map(convertS3ToHttps).filter(Boolean)
      : [convertS3ToHttps(imageUrls)].filter(Boolean);
    
    return {
      isCarousel: carouselMode,
      images: processedImages
    };
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