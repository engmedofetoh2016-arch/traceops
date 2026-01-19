using System.Security.Cryptography;
using System.Text;

namespace TraceOps.Api.Auth;

public static class ApiKeyHasher
{
    public static string Hash(string apiKey)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(apiKey));
        return Convert.ToHexString(bytes); // uppercase hex
    }
}
