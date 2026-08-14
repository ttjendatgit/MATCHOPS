using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities
{
    public class User
    {
        public Guid Id { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? PhoneNumber { get; set; }

        public string? PasswordHash { get; set; }

        public string? AvatarUrl { get; set; }

        public SkillLevel SkillLevel { get; set; } = SkillLevel.Beginner;

        public string? PreferredPlayingArea { get; set; }

        public UserRole Role { get; set; }

        public UserStatus Status { get; set; }

        public bool EmailConfirmed { get; set; }

        public string? EmailVerificationTokenHash { get; set; }

        public DateTime? EmailVerificationTokenExpiresAt { get; set; }

        public string? GoogleId { get; set; }

        public string AuthProvider { get; set; } = "LOCAL";

        public DateTime? LastLoginAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public bool IsDeleted { get; set; }

        public DateTime? DeletedAt { get; set; }

        public ICollection<Venue> OwnedVenues { get; set; } = new List<Venue>();

        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();

        public ICollection<CourtBlock> CourtBlocks { get; set; } = new List<CourtBlock>();

        public ICollection<Payment> Payments { get; set; } = new List<Payment>();

        public ICollection<Review> Reviews { get; set; } = new List<Review>();

        public ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
        public ICollection<MatchPost> MatchPosts { get; set; } = new List<MatchPost>();
        public ICollection<MatchRoomPlayer> MatchRooms { get; set; } = new List<MatchRoomPlayer>();
        public ICollection<AIChatMessage> AIChatMessages { get; set; } = new List<AIChatMessage>();
        public ICollection<ConversationParticipant> Conversations { get; set; } = new List<ConversationParticipant>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<UserConnection> Connections { get; set; } = new List<UserConnection>();
        public ICollection<FavoriteSport> FavoriteSports { get; set; } = new List<FavoriteSport>();
    }
}
