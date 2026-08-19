import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import {
  createInitialState,
  journeyReducer,
  skipsContext,
  type JourneyAction,
  type JourneyState,
} from "./journeyReducer";
import { localSessionRepository } from "./sessionRepository";
import { getEmotionNode, getFamilyOf } from "../config/emotion-taxonomy";
import { getPractice } from "../config/practices";

interface JourneyContextValue {
  state: JourneyState;
  dispatch: React.Dispatch<JourneyAction>;
  helpers: {
    family: ReturnType<typeof getFamilyOf>;
    selectedEmotion: ReturnType<typeof getEmotionNode>;
    selectedPractice: ReturnType<typeof getPractice>;
    needsContext: boolean;
  };
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

export const JourneyProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(journeyReducer, undefined, () => {
    return localSessionRepository.load() ?? createInitialState();
  });

  useEffect(() => {
    localSessionRepository.save(state);
  }, [state]);

  const value = useMemo<JourneyContextValue>(
    () => ({
      state,
      dispatch,
      helpers: {
        family: getFamilyOf(state.familyId),
        selectedEmotion: getEmotionNode(state.selectedEmotionId),
        selectedPractice: getPractice(state.selectedPracticeId),
        needsContext: !skipsContext(state.intensity, state.journeyMode),
      },
    }),
    [state]
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
};

export const useJourney = () => {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney deve ser usado dentro de JourneyProvider");
  return ctx;
};

export const clearJourneySession = () => localSessionRepository.clear();
