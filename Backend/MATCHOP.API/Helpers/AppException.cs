namespace MATCHOP.API.Helpers
{
    public class AppException : Exception
    {
        public string Code { get; }

        public int StatusCode { get; }

        public AppException(string code, string message, int statusCode = StatusCodes.Status400BadRequest)
            : base(message)
        {
            Code = code;
            StatusCode = statusCode;
        }
    }
}