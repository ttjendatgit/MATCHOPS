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
    NO_SHOW = 7
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