export interface LeagueMember {
  rank: number;
  name: string;
  level: number;
  xp: number;
  status: 'promote' | 'current' | 'keep' | 'demote';
  isUser?: boolean;
}

export function rankLeagueMembers(members: Array<Omit<LeagueMember, 'rank' | 'status'>>, currentUserId?: string) {
  return [...members]
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, 'ko'))
    .slice(0, 50)
    .map((member, index): LeagueMember => ({
      ...member,
      rank: index + 1,
      isUser: Boolean(member.isUser || ('id' in member && member.id === currentUserId)),
      status: member.isUser ? 'current' : index < 2 ? 'promote' : index >= Math.max(2, members.length - 2) ? 'demote' : 'keep',
    }));
}
