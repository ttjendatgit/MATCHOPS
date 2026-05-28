using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities
{
    public class User
    {
        public Guid Id { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? Phone { get; set; }

        public string? PasswordHash { get; set; }

        public string? Avatar { get; set; }

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

        public ICollection<Venue> OwnedVenues { get; set; } = new List<Venue>();

        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();

        public ICollection<CourtBlock> CourtBlocks { get; set; } = new List<CourtBlock>();

        public ICollection<Payment> Payments { get; set; } = new List<Payment>();

        public ICollection<Review> Reviews { get; set; } = new List<Review>();

        public ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
        public ICollection<MatchPost> MatchPosts { get; set; } = new List<MatchPost>();
        public ICollection<MatchRoomPlayer> MatchRooms { get; set; } = new List<MatchRoomPlayer>();
    }
}