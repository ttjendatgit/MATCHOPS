export interface MatchPost {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  sportId: string;
  sportName: string;
  minSkillLevel: number;
  maxSkillLevel: number;
  city: string;
  district: string;
  preferredTime: string;
  slotsNeeded: number;
  slotsFilled: number;
  note: string | null;
  status: 'OPEN' | 'CANCELLED' | 'COMPLETED';
}

export interface MatchRequest {
  id: string;
  postId: string;
  sportName: string;
  senderUserId: string;
  senderFullName: string;
  senderAvatar: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

export interface MatchRoom {
  id: string;
  sportName: string;
  matchDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  address: string;
  district: string;
  city: string;
  status: 'WAITING' | 'CONFIRMED' | 'CANCELLED';
  conversationId?: string;
  participants: MatchParticipant[];
}

export interface MatchParticipant {
  userId: string;
  fullName: string;
  avatar: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface CreateMatchPostDto {
  sportId: string;
  minSkillLevel: number;
  maxSkillLevel: number;
  city: string;
  district: string;
  preferredTime: string;
  slotsNeeded: number;
  note?: string;
}

export interface UserSkill {
  sportId: string;
  sportName: string;
  skillLevel: number;
}

export interface UpdateMatchPostDto {
  minSkillLevel?: number;
  maxSkillLevel?: number;
  district?: string;
  preferredTime?: string;
  slotsNeeded?: number;
  note?: string;
  status?: string;
}
