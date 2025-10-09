import { useState, useEffect, useMemo } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { usePublicConfig } from '@/hooks/usePublicConfig';
import { useTenant } from '@/hooks/useTenant';
import { Skeleton } from '@/components/ui/skeleton';
import Autoplay from 'embla-carousel-autoplay';

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
  const { getConfig, loading } = usePublicConfig(['homepage']);
  const { tenant } = useTenant();
  const [imageLoading, setImageLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const { isCarousel, images, autoPlayOptions } = useMemo(() => {
    if (loading) return { isCarousel: false, images: [], autoPlayOptions: null };
    
    // Prefer tenant configuration over public config
    const imageUrls = tenant?.theme_config?.hero_images || getConfig('homepage', 'hero_images', []);
    const carouselMode = getConfig('homepage', 'hero_carousel_mode', 'false');
    const autoPlay = tenant?.theme_config?.hero_autoplay ?? getConfig('homepage', 'hero_carousel_auto_play', false);
    const autoPlayDelay = tenant?.theme_config?.hero_autoplay_delay || Number(getConfig('homepage', 'hero_carousel_auto_play_delay', 5)) * 1000;
    
    console.log('HeroCarousel Debug:', { carouselMode, imageUrls, autoPlay, autoPlayDelay, loading, tenant });
    
    // Converter carouselMode string para boolean
    const isCarouselEnabled = carouselMode === 'true' || carouselMode === true;
    const isAutoPlayEnabled = autoPlay === 'true' || autoPlay === true || autoPlay === true;
    
    const processedImages = Array.isArray(imageUrls) 
      ? imageUrls.map(convertS3ToHttps).filter(Boolean)
      : [convertS3ToHttps(imageUrls)].filter(Boolean);
    
    const autoPlayPluginOptions = isAutoPlayEnabled ? {
      delay: typeof autoPlayDelay === 'number' ? autoPlayDelay : Number(autoPlayDelay) * 1000,
      stopOnMouseEnter: true,
      stopOnInteraction: false
    } : null;
    
    return {
      isCarousel: isCarouselEnabled,
      images: processedImages,
      autoPlayOptions: autoPlayPluginOptions
    };
  }, [loading, getConfig, tenant]);

  // Preload images for better performance
  useEffect(() => {
    if (images.length > 0) {
      const preloadImages = images.slice(0, 2); // Preload first 2 images
      preloadImages.forEach(src => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(src));
        };
        img.src = src;
      });
      
      // Set initial loading to false after a short delay
      const timer = setTimeout(() => setImageLoading(false), 100);
      return () => clearTimeout(timer);
    }
  }, [images]);

  // Handle individual image load
  const handleImageLoad = (src: string) => {
    setLoadedImages(prev => new Set(prev).add(src));
  };

  if (loading || (images.length === 0 && !loading)) {
    return (
      <div className="relative">
        {loading || imageLoading ? (
          <Skeleton className="w-full h-80 rounded-lg" />
        ) : (
          <img 
            src="https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/homepage/Hero.png" 
            alt="Profissional de saúde mental oferecendo cuidado e acolhimento" 
            className="w-full h-80 object-cover rounded-lg" 
            loading="eager"
            onLoad={() => handleImageLoad("https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/homepage/Hero.png")}
          />
        )}
      </div>
    );
  }

  if (!isCarousel || images.length === 1) {
    const imageSrc = images[0];
    const isImageLoaded = loadedImages.has(imageSrc);
    
    return (
      <div className="relative">
        {!isImageLoaded && <Skeleton className="absolute inset-0 w-full h-80 rounded-lg" />}
        <img 
          src={imageSrc} 
          alt="Profissional de saúde mental oferecendo cuidado e acolhimento" 
          className={`w-full h-80 object-cover rounded-lg transition-opacity duration-300 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="eager"
          onLoad={() => handleImageLoad(imageSrc)}
        />
      </div>
    );
  }

  const carouselOptions = {
    align: "start" as const,
    loop: true
  };

  const carouselPlugins = autoPlayOptions ? [Autoplay(autoPlayOptions)] : [];

  return (
    <div className="relative">
      <Carousel 
        className="w-full" 
        opts={carouselOptions}
        plugins={carouselPlugins}
      >
        <CarouselContent>
          {images.map((image, index) => {
            const isImageLoaded = loadedImages.has(image);
            return (
              <CarouselItem key={index}>
                <div className="relative">
                  {!isImageLoaded && <Skeleton className="absolute inset-0 w-full h-80 rounded-lg" />}
                  <img 
                    src={image} 
                    alt={`Profissional de saúde mental ${index + 1}`} 
                    className={`w-full h-80 object-cover rounded-lg transition-opacity duration-300 ${
                      isImageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading={index === 0 ? "eager" : "lazy"}
                    onLoad={() => handleImageLoad(image)}
                  />
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  );
};