import { useCallback } from 'react';
import { useSubscription } from './useSubscription';
import { PLAN_LIMITS } from '../types/subscription';

export function usePlanRestrictions() {
  const { getCurrentPlan, hasFeature } = useSubscription();

  const checkFeatureAccess = useCallback((feature: string) => {
    return hasFeature(feature);
  }, [hasFeature]);

  const getMealLimit = useCallback(() => {
    const currentPlan = getCurrentPlan() as keyof typeof PLAN_LIMITS;
    return PLAN_LIMITS[currentPlan]?.meals_per_day || 3;
  }, [getCurrentPlan]);

  const canAccessPoints = useCallback(() => {
    return hasFeature('points_system');
  }, [hasFeature]);

  const canAccessHistory = useCallback(() => {
    return hasFeature('history');
  }, [hasFeature]);

  const canCustomizeFood = useCallback(() => {
    return hasFeature('food_customization');
  }, [hasFeature]);

  const canAccessRewards = useCallback(() => {
    return hasFeature('rewards');
  }, [hasFeature]);

  const canAccessNutritionistSupport = useCallback(() => {
    return hasFeature('nutritionist_support');
  }, [hasFeature]);

  const getRestrictedFeatureName = useCallback((feature: string) => {
    const featureNames: Record<string, string> = {
      points_system: 'Sistema de Pontos',
      history: 'Histórico Completo',
      food_customization: 'Personalização de Alimentos',
      rewards: 'Sistema de Recompensas',
      nutritionist_support: 'Suporte ao Nutricionista'
    };
    return featureNames[feature] || feature;
  }, []);

  return {
    checkFeatureAccess,
    getMealLimit,
    canAccessPoints,
    canAccessHistory,
    canCustomizeFood,
    canAccessRewards,
    canAccessNutritionistSupport,
    getRestrictedFeatureName,
    currentPlan: getCurrentPlan()
  };
}