namespace MATCHOP.API.Helpers
{
    public class ErrorResponse
    {
        public bool Success { get; set; } = false;

        public string Code { get; set; } = string.Empty;

        public string Message { get; set; } = string.Empty;

        public Dictionary<string, string[]>? Errors { get; set; }
    }
}
