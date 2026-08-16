export interface MatchPost {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  sportId: string;
  sportName: string;
  minSkillLevel: string;
  maxSkillLevel: string;
  city: string;
  district: string;
  venueId?: string | null;
  venueName?: string | null;
  courtId?: string | null;
  courtName?: string | null;
  externalVenueName?: string | null;
  preferredTime: string;
  slotsNeeded: number;
  slotsFilled: number;
  note: string | null;
  status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export interface MatchRequest {
  id: string;
  postId: string;
  sportName: string;
  senderUserId: string;
  senderFullName: string;
  senderAvatar: string | null;
  receiverUserId: string;
  receiverFullName: string;
  receiverAvatar: string | null;
  postDistrict: string;
  postCity: string;
  postPreferredTime: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  roomId?: string;
}

export interface MatchRoom {
  id: string;
  sportId: string;
  sportName: string;
  matchPostId: string | null;
  conversationId: string | null;
  status: 'WAITING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  postCity: string;
  postDistrict: string;
  postPreferredTime: string | null;
  postMinSkillLevel: string;
  postMaxSkillLevel: string;
  slotsNeeded: number;
  slotsFilled: number;
  postStatus: string;
  ownerUserId: string | null;
  ownerName: string;
  players: MatchRoomPlayer[];
}

export interface MatchRoomPlayer {
  userId: string;
  fullName: string;
  avatar: string | null;
  isHost: boolean;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'LEFT';
  joinedAt: string;
}

export interface CreateMatchPostDto {
  sportId: string;
  minSkillLevel: number;
  maxSkillLevel: number;
  city: string;
  district: string;
  venueId?: string;
  courtId?: string;
  externalVenueName?: string;
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
  city?: string;
  district?: string;
  venueId?: string;
  courtId?: string;
  externalVenueName?: string;
  clearVenue?: boolean;
  preferredTime?: string;
  slotsNeeded?: number;
  note?: string;
  status?: string;
}
