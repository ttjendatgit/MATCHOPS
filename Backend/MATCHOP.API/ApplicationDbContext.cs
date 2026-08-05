using MATCHOP.API.Entities;
using Microsoft.EntityFrameworkCore;
using MATCHOP.API.Enums;
namespace MATCHOP.API;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<FavoriteSport> FavoriteSports => Set<FavoriteSport>();
    public DbSet<Sport> Sports => Set<Sport>();
    public DbSet<Venue> Venues => Set<Venue>();
    public DbSet<Court> Courts => Set<Court>();
    public DbSet<CourtImage> CourtImages => Set<CourtImage>();
    public DbSet<PriceRule> PriceRules => Set<PriceRule>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingSlot> BookingSlots => Set<BookingSlot>();
    public DbSet<CourtBlock> CourtBlocks => Set<CourtBlock>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<UserSkill> UserSkills => Set<UserSkill>();
    public DbSet<CoachProfile> CoachProfiles => Set<CoachProfile>();
    public DbSet<CoachSport> CoachSports => Set<CoachSport>();
    public DbSet<CoachProfileProof> CoachProfileProofs => Set<CoachProfileProof>();
    public DbSet<CoachVerificationDocument> CoachVerificationDocuments => Set<CoachVerificationDocument>();
    public DbSet<MatchPost> MatchPosts => Set<MatchPost>();
    public DbSet<MatchQueue> MatchQueues => Set<MatchQueue>();
    public DbSet<MatchRoom> MatchRooms => Set<MatchRoom>();
    public DbSet<MatchRoomPlayer> MatchRoomPlayers => Set<MatchRoomPlayer>();
    public DbSet<MatchSuggestion> MatchSuggestions => Set<MatchSuggestion>();
    public DbSet<MatchRequest> MatchRequests => Set<MatchRequest>();
    public DbSet<AIChatMessage> AIChatMessages => Set<AIChatMessage>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<UserConnection>    UserConnections    => Set<UserConnection>();
    public DbSet<MembershipPlan>    MembershipPlans    => Set<MembershipPlan>();
    public DbSet<UserSubscription>  UserSubscriptions  => Set<UserSubscription>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── User ──────────────────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.FullName)
             .IsRequired()
             .HasMaxLength(200);

            e.Property(x => x.Email)
             .IsRequired()
             .HasMaxLength(200);

            e.Property(x => x.PhoneNumber)
             .HasMaxLength(20);

            e.Property(x => x.PasswordHash)
             .IsRequired(false);

            e.Property(x => x.AvatarUrl)
             .HasMaxLength(500);

            e.Property(x => x.SkillLevel)
             .HasConversion<int>()
             .HasDefaultValue(SkillLevel.Beginner)
             .HasSentinel((SkillLevel)0);

            e.Property(x => x.PreferredPlayingArea)
             .HasMaxLength(200);

            e.Property(x => x.Role)
             .HasConversion<int>();

            e.Property(x => x.Status)
             .HasConversion<int>();

            e.Property(x => x.EmailConfirmed)
             .HasDefaultValue(false);

            e.Property(x => x.EmailVerificationTokenHash)
             .HasMaxLength(500);

            e.Property(x => x.GoogleId)
             .HasMaxLength(200);

            e.Property(x => x.AuthProvider)
             .IsRequired()
             .HasMaxLength(50)
             .HasDefaultValue("LOCAL");

            e.HasIndex(x => x.Email)
             .IsUnique()
             .HasDatabaseName("ux_users_email");

            e.HasIndex(x => x.GoogleId)
             .HasDatabaseName("ix_users_google_id");

            e.HasIndex(x => x.EmailVerificationTokenHash)
             .HasDatabaseName("ix_users_email_verification_token_hash");

            e.HasIndex(x => x.PhoneNumber)
             .IsUnique()
             .HasFilter("\"PhoneNumber\" IS NOT NULL")
             .HasDatabaseName("ux_users_phone_number");
        });

        modelBuilder.Entity<FavoriteSport>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.SportType)
             .HasConversion<int>();

            e.HasOne(x => x.User)
             .WithMany(u => u.FavoriteSports)
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.UserId)
             .HasDatabaseName("ix_favorite_sports_user_id");

            e.HasIndex(x => new { x.UserId, x.SportType })
             .IsUnique()
             .HasDatabaseName("ux_favorite_sports_user_sport_type");
        });

        // ── Sport ─────────────────────────────────────────────────────
        modelBuilder.Entity<Sport>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.Name)
             .IsRequired()
             .HasMaxLength(100);

            e.Property(x => x.Icon)
             .HasMaxLength(500);

            e.Property(x => x.Status)
             .HasConversion<int>();

            e.HasIndex(x => x.Name)
             .IsUnique()
             .HasDatabaseName("ux_sports_name");
        });

        // ── Venue ─────────────────────────────────────────────────────
        modelBuilder.Entity<Venue>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.Name)
             .IsRequired()
             .HasMaxLength(200);

            e.Property(x => x.Address)
             .IsRequired()
             .HasMaxLength(500);

            e.Property(x => x.City)
             .IsRequired()
             .HasMaxLength(100);

            e.Property(x => x.District)
             .IsRequired()
             .HasMaxLength(100);

            e.Property(x => x.Ward)
             .HasMaxLength(100);

            e.Property(x => x.Latitude)
             .HasPrecision(10, 7);

            e.Property(x => x.Longitude)
             .HasPrecision(10, 7);

            e.Property(x => x.Description)
             .HasMaxLength(2000);

            e.Property(x => x.CoverImageUrl)
             .HasMaxLength(1000);

            e.Property(x => x.Status)
             .HasConversion<int>();

            e.HasOne(x => x.Owner)
             .WithMany(u => u.OwnedVenues)
             .HasForeignKey(x => x.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.OwnerId)
             .HasDatabaseName("ix_venues_owner_id");

            e.HasIndex(x => x.Status)
             .HasDatabaseName("ix_venues_status");
        });

        // ── Court ─────────────────────────────────────────────────────
        // ── Court ─────────────────────────────────────────────────────
        modelBuilder.Entity<Court>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.Name)
             .IsRequired()
             .HasMaxLength(200);

            e.Property(x => x.Type)
             .HasMaxLength(100);

            e.Property(x => x.Capacity);

            e.Property(x => x.LocationNote)
             .HasMaxLength(300);

            e.Property(x => x.Description)
             .HasMaxLength(2000);

            e.Property(x => x.ImageUrl)
             .HasMaxLength(1000);

            e.Property(x => x.ImagePublicId)
             .HasMaxLength(500);

            e.Property(x => x.Status)
             .HasConversion<int>();

            e.HasOne(x => x.Venue)
             .WithMany(v => v.Courts)
             .HasForeignKey(x => x.VenueId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Sport)
             .WithMany(s => s.Courts)
             .HasForeignKey(x => x.SportId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.VenueId)
             .HasDatabaseName("ix_courts_venue_id");

            e.HasIndex(x => x.SportId)
             .HasDatabaseName("ix_courts_sport_id");

            e.HasIndex(x => x.Status)
             .HasDatabaseName("ix_courts_status");

            e.HasIndex(x => new { x.VenueId, x.Name })
             .HasDatabaseName("ix_courts_venue_name");
        });

        // ── CourtImage ─────────────────────────────────────────────────
        modelBuilder.Entity<CourtImage>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.CourtId)
             .IsRequired();

            e.Property(x => x.ImageUrl)
             .IsRequired()
             .HasMaxLength(1000);

            e.Property(x => x.PublicId)
             .IsRequired()
             .HasMaxLength(500);

            e.Property(x => x.IsPrimary)
             .HasDefaultValue(false);

            e.Property(x => x.SortOrder)
             .HasDefaultValue(0);

            e.Property(x => x.CreatedAt)
             .HasDefaultValueSql("NOW()");

            e.HasOne(x => x.Court)
             .WithMany(c => c.Images)
             .HasForeignKey(x => x.CourtId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.CourtId)
             .HasDatabaseName("ix_court_images_court_id");

            e.HasIndex(x => new { x.CourtId, x.SortOrder })
             .HasDatabaseName("ix_court_images_court_sort_order");

            e.HasIndex(x => new { x.CourtId, x.IsPrimary })
             .HasDatabaseName("ix_court_images_court_primary");
        });

        // ── PriceRule ─────────────────────────────────────────────────
        modelBuilder.Entity<PriceRule>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.PricePerHour)
             .HasPrecision(18, 2)
             .IsRequired();

            e.Property(x => x.DayType)
             .HasConversion<int>();

            e.Property(x => x.Status)
             .HasConversion<int>();

            e.HasOne(x => x.Court)
             .WithMany(c => c.PriceRules)
             .HasForeignKey(x => x.CourtId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.CourtId)
             .HasDatabaseName("ix_price_rules_court_id");

            e.HasIndex(x => new { x.CourtId, x.DayType, x.StartTime, x.EndTime })
             .HasDatabaseName("ix_price_rules_court_day_time");

            e.HasIndex(x => x.Status)
             .HasDatabaseName("ix_price_rules_status");
        });

        // ── Booking ───────────────────────────────────────────────────
        modelBuilder.Entity<Booking>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.TotalPrice)
             .HasPrecision(18, 2)
             .IsRequired();

            e.Property(x => x.Status)
             .HasConversion<int>();

            e.Property(x => x.PaymentStatus)
             .HasConversion<int>();

            e.Property(x => x.BookingType)
             .HasConversion<int>();

            e.Property(x => x.CustomerName)
             .HasMaxLength(200);

            e.Property(x => x.CustomerPhone)
             .HasMaxLength(20);

            e.Property(x => x.Note)
             .HasMaxLength(1000);

            // UserId → người đặt sân online
            e.HasOne(x => x.User)
             .WithMany(u => u.Bookings)
             .HasForeignKey(x => x.UserId)
             .IsRequired(false)
             .OnDelete(DeleteBehavior.Restrict);

            // OwnerId → owner tạo booking offline
            e.HasOne(x => x.Owner)
             .WithMany()
             .HasForeignKey(x => x.OwnerId)
             .IsRequired(false)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Venue)
             .WithMany(v => v.Bookings)
             .HasForeignKey(x => x.VenueId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Court)
             .WithMany(c => c.Bookings)
             .HasForeignKey(x => x.CourtId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Sport)
             .WithMany(s => s.Bookings)
             .HasForeignKey(x => x.SportId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.CourtId, x.BookingDate })
             .HasDatabaseName("ix_bookings_court_date");

            e.HasIndex(x => x.UserId)
             .HasDatabaseName("ix_bookings_user");

            e.HasIndex(x => x.Status)
             .HasDatabaseName("ix_bookings_status");
        });

        // ── BookingSlot ───────────────────────────────────────────────
        modelBuilder.Entity<BookingSlot>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.Status)
             .HasConversion<int>();

            e.HasOne(x => x.Booking)
             .WithMany(b => b.BookingSlots)
             .HasForeignKey(x => x.BookingId)
             .IsRequired(false)
             .OnDelete(DeleteBehavior.SetNull);

            e.HasOne(x => x.Court)
             .WithMany(c => c.BookingSlots)
             .HasForeignKey(x => x.CourtId)
             .OnDelete(DeleteBehavior.Restrict);

            // Index thường để query nhanh theo sân + ngày
            e.HasIndex(x => new { x.CourtId, x.SlotDate, x.SlotStartTime })
             .HasDatabaseName("ix_booking_slots_court_date_time");

            // Partial unique index — chống double-booking tại DB level
            // Status: HOLDING=1, BOOKED=2, BLOCKED=3
            e.HasIndex(x => new { x.CourtId, x.SlotDate, x.SlotStartTime })
             .IsUnique()
             .HasDatabaseName("ux_booking_slots_active")
             .HasFilter("\"Status\" IN (1, 2, 3)");
        });

        // ── CourtBlock ────────────────────────────────────────────────
        modelBuilder.Entity<CourtBlock>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.Reason)
             .HasMaxLength(500);

            e.Property(x => x.Status)
             .HasConversion<int>();

            e.HasOne(x => x.Owner)
             .WithMany(u => u.CourtBlocks)
             .HasForeignKey(x => x.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Venue)
             .WithMany(v => v.CourtBlocks)
             .HasForeignKey(x => x.VenueId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Court)
             .WithMany(c => c.CourtBlocks)
             .HasForeignKey(x => x.CourtId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Payment ───────────────────────────────────────────────────
        modelBuilder.Entity<Payment>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.Amount)
             .HasPrecision(18, 2)
             .IsRequired();

            e.Property(x => x.Method)
             .HasConversion<int>();

            e.Property(x => x.Status)
             .HasConversion<int>();

            e.Property(x => x.TransactionCode)
             .HasMaxLength(100);

            e.HasOne(x => x.Booking)
             .WithMany(b => b.Payments)
             .HasForeignKey(x => x.BookingId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.User)
             .WithMany(u => u.Payments)
             .HasForeignKey(x => x.UserId)
             .IsRequired(false)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Review ────────────────────────────────────────────────────
        modelBuilder.Entity<Review>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.Rating)
             .IsRequired();

            e.Property(x => x.Comment)
             .HasMaxLength(1000);

            e.HasOne(x => x.User)
             .WithMany(u => u.Reviews)
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Venue)
             .WithMany(v => v.Reviews)
             .HasForeignKey(x => x.VenueId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Booking)
             .WithMany()
             .HasForeignKey(x => x.BookingId)
             .OnDelete(DeleteBehavior.Restrict);

            // Mỗi booking chỉ được review đúng một lần
            e.HasIndex(x => x.BookingId)
             .IsUnique()
             .HasDatabaseName("ux_reviews_booking");
        });
        //-- UserSkill
        // ── UserSkill ───────────────────────────────────
        modelBuilder.Entity<UserSkill>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.Level)
             .HasConversion<int>();

            e.Property(x => x.CreatedAt)
             .HasDefaultValueSql("NOW()");

            e.HasOne(x => x.User)
             .WithMany(u => u.UserSkills)
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.Sport)
             .WithMany(s => s.UserSkills)
             .HasForeignKey(x => x.SportId)
             .OnDelete(DeleteBehavior.Cascade);

            // 1 user chỉ có 1 skill level cho 1 môn
            e.HasIndex(x => new { x.UserId, x.SportId })
             .IsUnique()
             .HasDatabaseName("ux_user_skills_user_sport");

            e.HasIndex(x => x.Level)
             .HasDatabaseName("ix_user_skills_level");
        });

        // ── CoachProfile ──────────────────────────────────────────────
        // 1:1 optional extension of User — same shape as UserSubscription
        // (unique FK, Cascade on User delete since no other entity
        // references CoachProfile yet). Sport is intentionally left
        // untouched by any cascade below.
        modelBuilder.Entity<CoachProfile>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.DisplayName)
             .HasMaxLength(200);

            e.Property(x => x.Bio)
             .HasMaxLength(2000);

            e.Property(x => x.HourlyRate)
             .HasPrecision(18, 2);

            e.Property(x => x.City)
             .IsRequired()
             .HasMaxLength(100);

            e.Property(x => x.District)
             .IsRequired()
             .HasMaxLength(100);

            e.Property(x => x.Achievements)
             .HasMaxLength(2000);

            e.Property(x => x.Status)
             .HasConversion<int>();

            e.Property(x => x.RejectionReason)
             .HasMaxLength(500);

            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            // One coach profile per user
            e.HasIndex(x => x.UserId)
             .IsUnique()
             .HasDatabaseName("ux_coach_profiles_user_id");

            e.HasIndex(x => x.Status)
             .HasDatabaseName("ix_coach_profiles_status");

            e.HasIndex(x => new { x.City, x.District })
             .HasDatabaseName("ix_coach_profiles_location");
        });

        // ── CoachSport ────────────────────────────────────────────────
        modelBuilder.Entity<CoachSport>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.CreatedAt)
             .HasDefaultValueSql("NOW()");

            e.HasOne(x => x.CoachProfile)
             .WithMany(cp => cp.CoachSports)
             .HasForeignKey(x => x.CoachProfileId)
             .OnDelete(DeleteBehavior.Cascade);

            // Restrict, not Cascade — Sport is shared reference data
            // (also used by Courts/Bookings/UserSkills); deleting a coach
            // profile must never be able to delete a Sport record.
            e.HasOne(x => x.Sport)
             .WithMany()
             .HasForeignKey(x => x.SportId)
             .OnDelete(DeleteBehavior.Restrict);

            // 1 coach can only tag a given sport once
            e.HasIndex(x => new { x.CoachProfileId, x.SportId })
             .IsUnique()
             .HasDatabaseName("ux_coach_sports_profile_sport");

            e.HasIndex(x => x.SportId)
             .HasDatabaseName("ix_coach_sports_sport_id");
        });

        // ── CoachProfileProof ────────────────────────────────────────────
        modelBuilder.Entity<CoachProfileProof>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.CoachProfileId)
             .IsRequired();

            e.Property(x => x.ImageUrl)
             .IsRequired()
             .HasMaxLength(1000);

            e.Property(x => x.PublicId)
             .IsRequired()
             .HasMaxLength(500);

            e.Property(x => x.ProofType)
             .IsRequired()
             .HasConversion<int>();

            e.Property(x => x.SortOrder)
             .HasDefaultValue(0);

            e.Property(x => x.CreatedAt)
             .HasDefaultValueSql("NOW()");

            e.HasOne(x => x.CoachProfile)
             .WithMany(cp => cp.Proofs)
             .HasForeignKey(x => x.CoachProfileId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.CoachProfileId)
             .HasDatabaseName("ix_coach_profile_proofs_coach_profile_id");

            e.HasIndex(x => new { x.CoachProfileId, x.SortOrder })
             .HasDatabaseName("ix_coach_profile_proofs_coach_profile_sort_order");
        });

        // ── CoachVerificationDocument ────────────────────────────────────
        // Formal review documents (certificates, club confirmations, etc.)
        // kept separate from CoachProfileProof so image "achievement" media
        // and admin-reviewed verification paperwork don't get conflated.
        modelBuilder.Entity<CoachVerificationDocument>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.CoachProfileId)
             .IsRequired();

            e.Property(x => x.FileUrl)
             .IsRequired()
             .HasMaxLength(1000);

            e.Property(x => x.PublicId)
             .IsRequired()
             .HasMaxLength(500);

            e.Property(x => x.OriginalFileName)
             .IsRequired()
             .HasMaxLength(255);

            e.Property(x => x.ContentType)
             .IsRequired()
             .HasMaxLength(100);

            e.Property(x => x.FileSizeBytes)
             .IsRequired();

            e.Property(x => x.DocumentType)
             .IsRequired()
             .HasConversion<int>();

            e.Property(x => x.SortOrder)
             .HasDefaultValue(0);

            e.Property(x => x.CreatedAt)
             .HasDefaultValueSql("NOW()");

            e.HasOne(x => x.CoachProfile)
             .WithMany(cp => cp.VerificationDocuments)
             .HasForeignKey(x => x.CoachProfileId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.CoachProfileId)
             .HasDatabaseName("ix_coach_verification_documents_coach_profile_id");

            e.HasIndex(x => new { x.CoachProfileId, x.SortOrder })
             .HasDatabaseName("ix_coach_verification_documents_coach_profile_sort_order");
        });

        // ── MatchPost ─────────────────────────────────────────────────
        modelBuilder.Entity<MatchPost>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(x => x.MinSkillLevel).HasConversion<int>();
            e.Property(x => x.MaxSkillLevel).HasConversion<int>();
            e.Property(x => x.Status).HasConversion<int>();
            e.Property(x => x.City).IsRequired().HasMaxLength(100);
            e.Property(x => x.District).IsRequired().HasMaxLength(100);
            e.Property(x => x.Note).HasMaxLength(1000);

            e.HasOne(x => x.Creator).WithMany(u => u.MatchPosts).HasForeignKey(x => x.CreatorId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Sport).WithMany().HasForeignKey(x => x.SportId).OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.CreatorId).HasDatabaseName("ix_match_posts_creator");
            e.HasIndex(x => x.SportId).HasDatabaseName("ix_match_posts_sport");
            e.HasIndex(x => new { x.City, x.District }).HasDatabaseName("ix_match_posts_location");
            e.HasIndex(x => x.Status).HasDatabaseName("ix_match_posts_status");
        });

        // ── MatchQueue ────────────────────────────────────────────────
        modelBuilder.Entity<MatchQueue>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(x => x.SkillLevel).HasConversion<int>();
            e.Property(x => x.City).IsRequired().HasMaxLength(100);
            e.Property(x => x.District).IsRequired().HasMaxLength(100);

            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Sport).WithMany().HasForeignKey(x => x.SportId).OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.UserId, x.SportId }).IsUnique().HasDatabaseName("ux_match_queue_user_sport");
        });

        // ── MatchRoom ─────────────────────────────────────────────────
        modelBuilder.Entity<MatchRoom>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(x => x.Status).HasConversion<int>();

            e.HasOne(x => x.Sport).WithMany().HasForeignKey(x => x.SportId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.MatchPost).WithMany(p => p.MatchRooms).HasForeignKey(x => x.MatchPostId).OnDelete(DeleteBehavior.SetNull);
        });

        // ── MatchRoomPlayer ───────────────────────────────────────────
        modelBuilder.Entity<MatchRoomPlayer>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(x => x.Status).HasConversion<int>();

            e.HasOne(x => x.Room).WithMany(r => r.Players).HasForeignKey(x => x.RoomId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany(u => u.MatchRooms).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.RoomId, x.UserId }).IsUnique().HasDatabaseName("ux_match_room_players_room_user");
        });

        // ── MatchSuggestion ───────────────────────────────────────────
        modelBuilder.Entity<MatchSuggestion>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");

            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.SuggestedUser).WithMany().HasForeignKey(x => x.SuggestedUserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Sport).WithMany().HasForeignKey(x => x.SportId).OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => new { x.UserId, x.SuggestedUserId, x.SportId }).IsUnique().HasDatabaseName("ux_match_suggestions_unique");
        });

        // ── AIChatMessage ─────────────────────────────────────────────
        modelBuilder.Entity<AIChatMessage>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(x => x.Role).IsRequired().HasMaxLength(20);
            e.Property(x => x.Content).IsRequired();
            e.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");

            e.HasOne(x => x.User).WithMany(u => u.AIChatMessages).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(x => x.UserId).HasDatabaseName("ix_ai_chat_messages_user");
        });

        // ── Chat & Notifications ──────────────────────────────────────
        modelBuilder.Entity<Conversation>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(x => x.Type).HasConversion<int>();
        });

        modelBuilder.Entity<ConversationParticipant>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.HasOne(x => x.Conversation).WithMany(c => c.Participants).HasForeignKey(x => x.ConversationId);
            e.HasOne(x => x.User).WithMany(u => u.Conversations).HasForeignKey(x => x.UserId);
            e.HasIndex(x => new { x.ConversationId, x.UserId }).IsUnique();
        });

        modelBuilder.Entity<Message>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.HasOne(x => x.Conversation).WithMany(c => c.Messages).HasForeignKey(x => x.ConversationId);
            e.HasOne(x => x.Sender).WithMany().HasForeignKey(x => x.SenderId);
        });

        modelBuilder.Entity<Notification>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.Property(x => x.Type).HasConversion<int>();
            e.HasOne(x => x.User).WithMany(u => u.Notifications).HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<UserConnection>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasDefaultValueSql("gen_random_uuid()");
            e.HasOne(x => x.User).WithMany(u => u.Connections).HasForeignKey(x => x.UserId);
        });

        // ── MembershipPlan ────────────────────────────────────────────
        modelBuilder.Entity<MembershipPlan>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.Code)
             .IsRequired()
             .HasMaxLength(50);

            e.Property(x => x.Name)
             .IsRequired()
             .HasMaxLength(200);

            e.Property(x => x.TargetRole)
             .HasConversion<int>();

            e.Property(x => x.Tier)
             .HasConversion<int>();

            e.Property(x => x.PricePerMonth)
             .HasPrecision(18, 2);

            e.Property(x => x.PricePerYear)
             .HasPrecision(18, 2);

            e.Property(x => x.CommissionRate)
             .HasPrecision(5, 4);   // e.g. 0.0700

            e.Property(x => x.FeaturesJson)
             .HasMaxLength(2000);

            e.HasIndex(x => x.Code)
             .IsUnique()
             .HasDatabaseName("ux_membership_plans_code");

            e.HasIndex(x => new { x.TargetRole, x.IsActive })
             .HasDatabaseName("ix_membership_plans_role_active");

            // ── Seed: 7 default plans (idempotent via HasData) ────────
            var seedDate = new DateTime(2026, 6, 22, 0, 0, 0, DateTimeKind.Utc);

            e.HasData(
                // USER plans
                new MembershipPlan
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000001"),
                    Code = "USER_FREE", Name = "Người dùng Miễn phí",
                    TargetRole = UserRole.USER, Tier = MembershipTier.FREE,
                    PricePerMonth = 0, MaxMatchPostsPerMonth = 3, MaxJoinRequestsPerMonth = 5,
                    IsActive = true, SortOrder = 1, CreatedAt = seedDate, UpdatedAt = seedDate
                },
                new MembershipPlan
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000002"),
                    Code = "USER_PRO", Name = "Người dùng Pro",
                    TargetRole = UserRole.USER, Tier = MembershipTier.PRO,
                    PricePerMonth = 49000, MaxMatchPostsPerMonth = 20,
                    IsActive = true, SortOrder = 2, CreatedAt = seedDate, UpdatedAt = seedDate
                },
                new MembershipPlan
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000003"),
                    Code = "USER_PREMIUM", Name = "Người dùng Premium",
                    TargetRole = UserRole.USER, Tier = MembershipTier.PREMIUM,
                    PricePerMonth = 99000,
                    IsActive = true, SortOrder = 3, CreatedAt = seedDate, UpdatedAt = seedDate
                },
                // OWNER plans
                new MembershipPlan
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000004"),
                    Code = "OWNER_FREE", Name = "Chủ sân Miễn phí",
                    TargetRole = UserRole.OWNER, Tier = MembershipTier.FREE,
                    PricePerMonth = 0, CommissionRate = 0.07m, MaxVenues = 1, MaxCourts = 3,
                    IsActive = true, SortOrder = 4, CreatedAt = seedDate, UpdatedAt = seedDate
                },
                new MembershipPlan
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000005"),
                    Code = "OWNER_STANDARD", Name = "Chủ sân Standard",
                    TargetRole = UserRole.OWNER, Tier = MembershipTier.STANDARD,
                    PricePerMonth = 199000, CommissionRate = 0.05m, MaxVenues = 3, MaxCourts = 10,
                    IsActive = true, SortOrder = 5, CreatedAt = seedDate, UpdatedAt = seedDate
                },
                new MembershipPlan
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000006"),
                    Code = "OWNER_PRO", Name = "Chủ sân Pro",
                    TargetRole = UserRole.OWNER, Tier = MembershipTier.PRO,
                    PricePerMonth = 499000, CommissionRate = 0.03m, MaxVenues = 10,
                    IsActive = true, SortOrder = 6, CreatedAt = seedDate, UpdatedAt = seedDate
                },
                new MembershipPlan
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000007"),
                    Code = "OWNER_PREMIUM", Name = "Chủ sân Premium",
                    TargetRole = UserRole.OWNER, Tier = MembershipTier.PREMIUM,
                    PricePerMonth = 999000, CommissionRate = 0.02m,
                    IsActive = true, SortOrder = 7, CreatedAt = seedDate, UpdatedAt = seedDate
                }
            );
        });

        // ── UserSubscription ──────────────────────────────────────────
        modelBuilder.Entity<UserSubscription>(e =>
        {
            e.HasKey(x => x.Id);

            e.Property(x => x.Id)
             .HasDefaultValueSql("gen_random_uuid()");

            e.Property(x => x.Status)
             .HasConversion<int>();

            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.MembershipPlan)
             .WithMany(p => p.Subscriptions)
             .HasForeignKey(x => x.MembershipPlanId)
             .OnDelete(DeleteBehavior.Restrict);

            // One active subscription record per user
            e.HasIndex(x => x.UserId)
             .IsUnique()
             .HasDatabaseName("ux_user_subscriptions_user_id");

            e.HasIndex(x => new { x.Status, x.ExpiresAt })
             .HasDatabaseName("ix_user_subscriptions_status_expiry");
        });
    }
}
