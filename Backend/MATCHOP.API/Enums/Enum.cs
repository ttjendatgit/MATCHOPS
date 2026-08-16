namespace MATCHOP.API.Enums;

public enum UserRole
{
    USER = 1,
    OWNER = 2,
    ADMIN = 3
}

public enum UserStatus
{
    ACTIVE = 1,
    INACTIVE = 2,
    SUSPENDED = 3
}

public enum SportStatus
{
    ACTIVE = 1,
    INACTIVE = 2
}

public enum VenueStatus
{
    DRAFT = 1,
    PENDING_APPROVAL = 2,
    ACTIVE = 3,
    INACTIVE = 4,
    SUSPENDED = 5,
    REJECTED = 6
}

public enum CourtStatus
{
    ACTIVE = 1,
    INACTIVE = 2,
    MAINTENANCE = 3
}

public enum PriceRuleStatus
{
    ACTIVE = 1,
    INACTIVE = 2
}

public enum DayType
{
    ALL = 1,
    WEEKDAY = 2,
    WEEKEND = 3
}

public enum BookingStatus
{
    PENDING_PAYMENT = 1,
    CONFIRMED = 2,
    COMPLETED = 3,
    CANCELLED_BY_USER = 4,
    CANCELLED_BY_OWNER = 5,
    EXPIRED = 6,
    NO_SHOW = 7,
    CANCELLED_BY_ADMIN = 8
}

public enum BookingPaymentStatus
{
    UNPAID = 1,
    PAID = 2,
    FAILED = 3,
    REFUNDED = 4
}

public enum BookingType
{
    ONLINE = 1,
    OFFLINE = 2,
    ADMIN = 3
}

public enum BookingSource
{
    MATCHOP = 1,
    ZALO = 2,
    FACEBOOK = 3,
    PHONE = 4,
    DIRECT = 5,
    OTHER = 6
}

public enum BookingSlotStatus
{
    HOLDING = 1,
    BOOKED = 2,
    BLOCKED = 3,
    CANCELLED = 4,
    EXPIRED = 5
}

public enum CourtBlockStatus
{
    ACTIVE = 1,
    CANCELLED = 2
}

public enum PaymentMethod
{
    MOCK = 1,
    CASH = 2,
    BANK_TRANSFER = 3
}

public enum PaymentTransactionStatus
{
    PENDING = 1,
    SUCCESS = 2,
    FAILED = 3,
    REFUNDED = 4
}

public enum SkillLevel
{
    Beginner = 1,
    Intermediate = 2,
    Advanced = 3,
    Professional = 4,
    Competitive = Professional
}

public enum SportType
{
    Badminton = 1,
    Pickleball = 2,
    TableTennis = 3
}

public enum MatchPostStatus
{
    OPEN = 1,
    FILLED = 2,
    CANCELLED = 3,
    EXPIRED = 4
}

public enum MatchRoomStatus
{
    WAITING = 1,
    CONFIRMED = 2,
    CANCELLED = 3,
    COMPLETED = 4
}

public enum MatchRoomPlayerStatus
{
    PENDING = 1,
    ACCEPTED = 2,
    REJECTED = 3,
    LEFT = 4
}

public enum ConversationType
{
    PRIVATE = 1,
    GROUP = 2,
    VENUE = 3
}

public enum NotificationType
{
    BOOKING_CREATED = 1,
    BOOKING_CANCELLED = 2,
    MATCH_JOINED = 3,
    MATCH_INVITATION = 4,
    NEW_MESSAGE = 5,
    PAYMENT_SUCCESS = 6
}

public enum CoachProfileStatus
{
    PENDING_APPROVAL = 1,
    ACTIVE = 2,
    REJECTED = 3,
    SUSPENDED = 4
}

public enum OwnerApplicationStatus
{
    PENDING_APPROVAL = 1,
    APPROVED = 2,
    REJECTED = 3
}

public enum CoachProofType
{
    CERTIFICATION = 1,
    ACHIEVEMENT = 2,
    TRAINING_CREDENTIAL = 3,
    OTHER = 4
}

public enum CoachVerificationDocumentType
{
    COACHING_CERTIFICATE = 1,
    TRAINING_CERTIFICATE = 2,
    SPORT_ACHIEVEMENT = 3,
    CLUB_CONFIRMATION = 4,
    OTHER = 5
}

public enum CoachSessionRequestStatus
{
    PENDING = 1,
    ACCEPTED = 2,
    DECLINED = 3,
    CANCELLED = 4,
    COMPLETED = 5
}

public enum CoachSessionStatus
{
    AWAITING_PAYMENT = 1,
    PAID = 2,
    CANCELLED = 3,
    COMPLETED = 4
}

public enum CoachSessionPaymentStatus
{
    UNPAID = 1,
    PENDING = 2,
    PAID = 3,
    FAILED = 4,
    REFUNDED = 5
}

public enum MembershipTier
{
    FREE     = 1,
    STANDARD = 2,
    PRO      = 3,
    PREMIUM  = 4
}

public enum SubscriptionStatus
{
    ACTIVE    = 1,
    CANCELLED = 2,
    EXPIRED   = 3,
    PENDING   = 4
}
