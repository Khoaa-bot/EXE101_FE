import { useEffect, useState } from "react";
import {
  getMySubscription,
  getSubscriptionPlans,
  type MySubscription,
  type SubscriptionPlan,
} from "../services/api";

// Gói hội viên đang bán cho khách (forGarage = false) hoặc garage (true), cùng gói người dùng đang có.
export function useSubscription(forGarage: boolean) {
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [status, setStatus] = useState<MySubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSubscriptionPlans(forGarage), getMySubscription()])
      .then(([plans, mine]) => {
        if (cancelled) return;
        setPlan(plans.find((item) => item.isActive) ?? null);
        setStatus(mine);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Không tải được thông tin gói hội viên.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [forGarage]);

  return { plan, status, isLoading, error };
}

// Gói còn hạn thì thời hạn mới được cộng nối tiếp; hết hạn hoặc chưa mua thì tính từ hôm nay.
export function nextExpiryDate(plan: SubscriptionPlan, status: MySubscription | null): Date {
  const now = new Date();
  const current = status?.subscriptionExpiresAt ? new Date(status.subscriptionExpiresAt) : null;
  const start = current && current.getTime() > now.getTime() ? current : now;
  return new Date(start.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
}
