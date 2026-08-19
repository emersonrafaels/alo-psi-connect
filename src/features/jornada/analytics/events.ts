/** Catálogo de eventos de analytics da Jornada de Autorregulação. */
export const JOURNEY_EVENTS = {
  practicesHomeOpened: "practices_home_opened",
  journeyStarted: "journey_started",
  journeyModeSelected: "journey_mode_selected",
  emotionWheelOpened: "emotion_wheel_opened",
  emotionFamilySelected: "emotion_family_selected",
  emotionLevel2Selected: "emotion_level2_selected",
  emotionLevel3Selected: "emotion_level3_selected",
  emotionSelected: "emotion_selected",
  intensitySelected: "intensity_selected",
  contextAnswered: "context_answered",
  recommendationGenerated: "recommendation_generated",
  alternativeRequested: "alternative_requested",
  recommendationSelected: "recommendation_selected",
  practiceStarted: "practice_started",
  practicePaused: "practice_paused",
  practiceResumed: "practice_resumed",
  practiceAbandoned: "practice_abandoned",
  practiceCompleted: "practice_completed",
  checkoutStarted: "checkout_started",
  checkoutCompleted: "checkout_completed",
  stressMapStarted: "stress_map_started",
  stressMapCompleted: "stress_map_completed",
  actionReflectionStarted: "action_reflection_started",
  actionReflectionCompleted: "action_reflection_completed",
  journeyCompleted: "journey_completed",
  journeyAbandoned: "journey_abandoned",
  supportCtaClicked: "support_cta_clicked",
} as const;

export type JourneyEvent = (typeof JOURNEY_EVENTS)[keyof typeof JOURNEY_EVENTS];

export interface JourneyEventProps {
  sessionId?: string;
  journeyMode?: string;
  entryPoint?: string;
  taxonomyVersion?: string;
  emotionId?: string;
  emotionLevel?: number;
  familyId?: string;
  intensity?: number;
  contextAnswerId?: string;
  ruleId?: string;
  ruleVersion?: string;
  practiceId?: string;
  practiceVersion?: string;
  protocolId?: string;
  practiceIds?: string[];
  stage?: string;
  [key: string]: unknown;
}
