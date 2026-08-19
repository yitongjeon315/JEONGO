export type RedemptionStatus = 'pending' | 'approved' | 'sent' | 'cancelled';

export interface RewardRedemptionSummary {
  id: string;
  rewardId: string;
  rewardName: string;
  cost: number;
  phoneMasked: string;
  status: RedemptionStatus;
  createdAt: string;
}

export function normalizeKoreanPhone(value: unknown) {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  return /^01[016789]\d{7,8}$/.test(digits) ? digits : null;
}

export function maskPhone(phone: string) {
  return `${phone.slice(0, 3)}-****-${phone.slice(-4)}`;
}
