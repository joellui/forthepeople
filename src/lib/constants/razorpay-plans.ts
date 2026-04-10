/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// Razorpay Plan IDs — populated after running scripts/setup-razorpay-plans.ts
// These are Razorpay Plan IDs, NOT subscription IDs
export const RAZORPAY_PLANS = {
  monthly: process.env.RAZORPAY_PLAN_MONTHLY ?? "",
  district: process.env.RAZORPAY_PLAN_DISTRICT ?? "",
  state: process.env.RAZORPAY_PLAN_STATE ?? "",
  patron: process.env.RAZORPAY_PLAN_PATRON ?? "",
} as const;

export interface TierConfigItem {
  name: string;
  amount: number;
  isRecurring: boolean;
  description: string;
  emoji: string;
  badgeType: string | null;
  requiresDistrict?: boolean;
  requiresState?: boolean;
  color: string;
  border: string;
  accent: string;
  featured?: boolean;
}

export const TIER_CONFIG: Record<string, TierConfigItem> = {
  chai: {
    name: "Buy me a Chai",
    amount: 50,
    isRecurring: false,
    description: "One-time · covers 1 hour of server cost",
    emoji: "☕",
    badgeType: null,
    color: "#FFF7ED",
    border: "#FED7AA",
    accent: "#F97316",
  },
  monthly: {
    name: "Monthly Supporter",
    amount: 200,
    isRecurring: true,
    description: "Monthly · keeps one taluk's data pipeline running",
    emoji: "🙏",
    badgeType: "supporter",
    color: "#F0FDFA",
    border: "#99F6E4",
    accent: "#0D9488",
    featured: true,
  },
  district: {
    name: "District Champion",
    amount: 2000,
    isRecurring: true,
    description: "Monthly · your name on the district page you sponsor",
    emoji: "🏛️",
    badgeType: "champion",
    requiresDistrict: true,
    color: "#EFF6FF",
    border: "#BFDBFE",
    accent: "#2563EB",
  },
  state: {
    name: "State Champion",
    amount: 10000,
    isRecurring: true,
    description: "Monthly · your name on all districts in one state",
    emoji: "🇮🇳",
    badgeType: "state",
    requiresState: true,
    color: "#F5F3FF",
    border: "#DDD6FE",
    accent: "#7C3AED",
  },
  patron: {
    name: "All-India Patron",
    amount: 50000,
    isRecurring: true,
    description: "Monthly · help us cover all 780 districts across India",
    emoji: "🌟",
    badgeType: "patron",
    color: "#FEF2F2",
    border: "#FECACA",
    accent: "#DC2626",
  },
  custom: {
    name: "Custom Amount",
    amount: 10,
    isRecurring: false,
    description: "Any amount from ₹10 · every rupee goes to infrastructure",
    emoji: "💝",
    badgeType: null,
    color: "#F9F9F7",
    border: "#D0D0CC",
    accent: "#374151",
  },
};

// Ordered tier keys for display (two rows of 3)
export const TIER_ORDER = ["chai", "monthly", "district", "state", "patron", "custom"] as const;

// Tier priority for sorting (higher = more prominent)
export const TIER_PRIORITY: Record<string, number> = {
  patron: 5,
  state: 4,
  district: 3,
  monthly: 2,
  chai: 1,
  custom: 0,
};
