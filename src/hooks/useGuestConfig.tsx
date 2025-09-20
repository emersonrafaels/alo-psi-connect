import { usePublicConfig } from "./usePublicConfig";

export const useGuestConfig = () => {
  const { getConfig, loading } = usePublicConfig(['system']);

  const getGuestDiaryLimit = (): number => {
    const limit = getConfig('system', 'guest_diary_limit', 3);
    return typeof limit === 'string' ? parseInt(limit, 10) : limit;
  };

  return {
    getGuestDiaryLimit,
    loading
  };
};