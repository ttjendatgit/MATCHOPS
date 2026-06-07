using MATCHOP.API.Enums;

namespace MATCHOP.API.Entities
{
    public class FavoriteSport
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public SportType SportType { get; set; }

        public User? User { get; set; }
    }
}

