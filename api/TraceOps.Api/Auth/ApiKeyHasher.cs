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

    // ✅ ADD THIS
    public static string GenerateKey()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }
}
