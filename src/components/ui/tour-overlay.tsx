import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
}

interface TourOverlayProps {
  show: boolean;
  currentStep: number;
  totalSteps: number;
  stepData: TourStep | undefined;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export const TourOverlay = ({
  show,
  currentStep,
  totalSteps,
  stepData,
  onNext,
  onPrev,
  onSkip,
}: TourOverlayProps) => {
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number; placement: 'below' | 'above' }>({ top: 0, left: 0, placement: 'below' });
  const cardRef = useRef<HTMLDivElement>(null);
  const previousTargetRef = useRef<HTMLElement | null>(null);

  const calculatePosition = useCallback(() => {
    if (!stepData?.target) {
      setSpotlightRect(null);
      return;
    }

    const el = document.querySelector(stepData.target) as HTMLElement | null;
    if (!el) {
      setSpotlightRect(null);
      return;
    }

    // Scroll into view if needed
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Small delay after scroll to get correct rect
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      setSpotlightRect(rect);

      const padding = 12;
      const spaceBelow = window.innerHeight - rect.bottom;
      const placement = spaceBelow > 220 ? 'below' : 'above';

      const cardWidth = 360;
      let left = rect.left + rect.width / 2 - cardWidth / 2;
      left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));

      const top = placement === 'below'
        ? rect.bottom + padding
        : rect.top - padding;

      setCardPosition({ top, left, placement });
    });
  }, [stepData]);

  useEffect(() => {
    if (!show || !stepData) return;

    // Clean up previous target z-index
    if (previousTargetRef.current) {
      previousTargetRef.current.style.removeProperty('position');
      previousTargetRef.current.style.removeProperty('z-index');
    }

    if (stepData.target) {
      const el = document.querySelector(stepData.target) as HTMLElement | null;
      if (el) {
        el.style.position = 'relative';
        el.style.zIndex = '10001';
        previousTargetRef.current = el;
      }
    }

    calculatePosition();

    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [show, stepData, calculatePosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previousTargetRef.current) {
        previousTargetRef.current.style.removeProperty('position');
        previousTargetRef.current.style.removeProperty('z-index');
      }
    };
  }, []);

  if (!show || !stepData) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps - 1;
  const hasTarget = !!spotlightRect;

  const overlay = (
    <div className="fixed inset-0" style={{ zIndex: 10000 }}>
      {/* Dark backdrop */}
      {!hasTarget && (
        <div
          className="absolute inset-0 bg-black/60 transition-opacity duration-300"
          onClick={onSkip}
        />
      )}

      {/* Spotlight cutout */}
      {hasTarget && spotlightRect && (
        <>
          <div
            className="absolute inset-0"
            style={{ pointerEvents: 'auto' }}
            onClick={onSkip}
          />
          <div
            className="absolute rounded-lg transition-all duration-300 ease-in-out"
            style={{
              top: spotlightRect.top - 6,
              left: spotlightRect.left - 6,
              width: spotlightRect.width + 12,
              height: spotlightRect.height + 12,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              borderRadius: '12px',
              pointerEvents: 'none',
            }}
          />
          {/* Highlight ring */}
          <div
            className="absolute rounded-lg border-2 border-primary/60 transition-all duration-300 ease-in-out"
            style={{
              top: spotlightRect.top - 6,
              left: spotlightRect.left - 6,
              width: spotlightRect.width + 12,
              height: spotlightRect.height + 12,
              pointerEvents: 'none',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        </>
      )}

      {/* Tour card */}
      <div
        ref={cardRef}
        className="absolute bg-popover border border-border rounded-xl shadow-2xl p-5 transition-all duration-300 ease-in-out"
        style={
          hasTarget
            ? {
                top: cardPosition.placement === 'below' ? cardPosition.top : undefined,
                bottom: cardPosition.placement === 'above' ? window.innerHeight - cardPosition.top : undefined,
                left: cardPosition.left,
                width: 360,
                maxWidth: 'calc(100vw - 32px)',
                zIndex: 10002,
              }
            : {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                maxWidth: 'calc(100vw - 32px)',
                zIndex: 10002,
              }
        }
      >
        {/* Arrow pointing to element */}
        {hasTarget && spotlightRect && (
          <div
            className="absolute w-3 h-3 bg-popover border-border rotate-45"
            style={
              cardPosition.placement === 'below'
                ? {
                    top: -6,
                    left: Math.min(
                      Math.max(spotlightRect.left + spotlightRect.width / 2 - cardPosition.left, 20),
                      340
                    ),
                    borderTop: '1px solid',
                    borderLeft: '1px solid',
                    borderColor: 'inherit',
                  }
                : {
                    bottom: -6,
                    left: Math.min(
                      Math.max(spotlightRect.left + spotlightRect.width / 2 - cardPosition.left, 20),
                      340
                    ),
                    borderBottom: '1px solid',
                    borderRight: '1px solid',
                    borderColor: 'inherit',
                  }
            }
          />
        )}

        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Passo {currentStep + 1} de {totalSteps}
          </span>
        </div>

        <h3 className="text-base font-semibold text-foreground mb-1.5">
          {stepData.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {stepData.description}
        </p>

        <Progress value={progress} className="h-1 mb-4" />

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-muted-foreground text-xs h-8 px-2"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Pular
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={onPrev} className="h-8 text-xs">
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Anterior
              </Button>
            )}
            <Button size="sm" onClick={onNext} className="h-8 text-xs">
              {isLastStep ? (
                'Começar'
              ) : (
                <>
                  Próximo
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};
