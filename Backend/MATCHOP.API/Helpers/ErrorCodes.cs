namespace MATCHOP.API.Helpers
{
    public static class ErrorCodes
    {
        public const string AuthRequired = "AUTH_REQUIRED";
        public const string PermissionDenied = "PERMISSION_DENIED";

        public const string UserNotFound = "USER_NOT_FOUND";
        public const string VenueNotFound = "VENUE_NOT_FOUND";
        public const string CourtNotFound = "COURT_NOT_FOUND";
        public const string SportNotFound = "SPORT_NOT_FOUND";
        public const string SportNameAlreadyExists = "SPORT_NAME_ALREADY_EXISTS";

        public const string VENUE_NOT_FOUND = "VENUE_NOT_FOUND";
        public const string INVALID_TIME_RANGE = "INVALID_TIME_RANGE";
        public const string FORBIDDEN = "FORBIDDEN";
        public const string UNAUTHORIZED = "UNAUTHORIZED";


        public const string VenueInactive = "VENUE_INACTIVE";
        public const string CourtInactive = "COURT_INACTIVE";

        public const string InvalidTimeRange = "INVALID_TIME_RANGE";
        public const string BookingInPast = "BOOKING_IN_PAST";
        public const string BookingDurationTooShort = "BOOKING_DURATION_TOO_SHORT";
        public const string BookingDurationTooLong = "BOOKING_DURATION_TOO_LONG";
        public const string InvalidTimeBlock = "INVALID_TIME_BLOCK";
        public const string OutsideOpeningHours = "OUTSIDE_OPENING_HOURS";
        public const string PriceRuleNotFound = "PRICE_RULE_NOT_FOUND";
        public const string SlotAlreadyBooked = "SLOT_ALREADY_BOOKED";

        public const string BookingNotFound = "BOOKING_NOT_FOUND";
        public const string BookingExpired = "BOOKING_EXPIRED";
        public const string BookingAlreadyPaid = "BOOKING_ALREADY_PAID";
        public const string BookingAlreadyCancelled = "BOOKING_ALREADY_CANCELLED";

        public const string PaymentFailed = "PAYMENT_FAILED";
        public const string ReviewNotAllowed = "REVIEW_NOT_ALLOWED";

        public const string ValidationError = "VALIDATION_ERROR";
        public const string InternalServerError = "INTERNAL_SERVER_ERROR";

        public const string FILE_TOO_LARGE = "FILE_TOO_LARGE";
        public const string INVALID_FILE_TYPE = "INVALID_FILE_TYPE";
        public const string UPLOAD_FAILED = "UPLOAD_FAILED";

        public const string CourtNameAlreadyExists = "COURT_NAME_ALREADY_EXISTS";
        public const string InvalidCourtStatus = "INVALID_COURT_STATUS";
        public const string InvalidCapacity = "INVALID_CAPACITY";
        public const string InvalidImageUrl = "INVALID_IMAGE_URL";
        
    }
}