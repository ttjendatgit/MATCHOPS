import type { MatchPost } from "@/types/match";

export function formatMatchVenueLabel(post: Pick<
  MatchPost,
  "venueName" | "courtName" | "externalVenueName"
>): string | null {
  if (post.venueName && post.courtName) return `${post.venueName} · ${post.courtName}`;
  if (post.venueName) return post.venueName;
  if (post.externalVenueName) return post.externalVenueName;
  return null;
}

export function formatMatchLocation(post: Pick<
  MatchPost,
  "district" | "city" | "venueName" | "courtName" | "externalVenueName"
>): string {
  const venue = formatMatchVenueLabel(post);
  const area = `${post.district}, ${post.city}`;
  return venue ? `${venue} · ${area}` : area;
}
