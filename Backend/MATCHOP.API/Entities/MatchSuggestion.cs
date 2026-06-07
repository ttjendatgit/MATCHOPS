namespace MATCHOP.API.Entities
{
    public class MatchSuggestion
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public Guid SuggestedUserId { get; set; }
        public User SuggestedUser { get; set; } = null!;
        public Guid SportId { get; set; }
        public Sport Sport { get; set; } = null!;
        public double Score { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
