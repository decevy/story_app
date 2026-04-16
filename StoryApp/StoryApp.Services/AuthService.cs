using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using StoryApp.Core.Dtos;
using StoryApp.Core.Dtos.Requests;
using StoryApp.Core.Dtos.Responses;
using StoryApp.Core.Entities;
using StoryApp.Core.Exceptions;
using StoryApp.Core.Interfaces;

namespace StoryApp.Services;

public class AuthService(IUserRepository userRepository, IConfiguration config) : IAuthService
{
    public async Task<LoginResponse> RegisterAsync(RegisterRequest request)
    {
        // Check if email already exists
        var existingUser = await userRepository.FindByEmailAsync(request.Email);
        if (existingUser != null)
            throw new BadRequestException("Email already registered");

        // Check if username already exists
        var existingUsername = await userRepository.FindByUsernameAsync(request.Username);
        if (existingUsername != null)
            throw new BadRequestException("Username already taken");

        // Create user
        var passwordHash = HashPassword(request.Password);
        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow,
            LastSeen = DateTime.UtcNow,
            IsOnline = true
        };
        await userRepository.CreateAsync(user);

        // Generate tokens
        var accessToken = GenerateJwtToken(user.Id, user.Email, user.Username);
        var refreshToken = GenerateRefreshToken();

        // Store refresh token hash
        user.RefreshToken = HashRefreshToken(refreshToken);
        user.RefreshTokenExpiry = GetRefreshTokenExpiry();
        await userRepository.UpdateAsync(user);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = UserDto.FromEntity(user)
        };
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        // Verify user credentials
        var user = await userRepository.FindByEmailAsync(request.Email)
            ?? throw new UnauthorizedException("Invalid credentials"); 

        if (!VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid credentials");

        // Generate tokens
        var accessToken = GenerateJwtToken(user.Id, user.Email, user.Username);
        var refreshToken = GenerateRefreshToken();

        // Store refresh token hash and update online status
        user.RefreshToken = HashRefreshToken(refreshToken);
        user.RefreshTokenExpiry = GetRefreshTokenExpiry();
        user.IsOnline = true;
        user.LastSeen = DateTime.UtcNow;
        await userRepository.UpdateAsync(user);

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = UserDto.FromEntity(user)
        };
    }

    public async Task<LoginResponse> RefreshTokenAsync(string refreshToken)
    {
        // Find user with this refresh token
        var hashedToken = HashRefreshToken(refreshToken);
        var user = await userRepository.FindByRefreshTokenAsync(hashedToken);
        if (user?.RefreshTokenExpiry == null || user.RefreshTokenExpiry < DateTime.UtcNow)
            throw new UnauthorizedException("Invalid or expired refresh token");

        // Generate new tokens
        var newAccessToken = GenerateJwtToken(user.Id, user.Email, user.Username);
        var newRefreshToken = GenerateRefreshToken();

        // Update refresh token
        user.RefreshToken = HashRefreshToken(newRefreshToken);
        user.RefreshTokenExpiry = GetRefreshTokenExpiry();
        await userRepository.UpdateAsync(user);

        return new LoginResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            User = UserDto.FromEntity(user)
        };
    }

    public async Task RevokeTokenAsync(int userId)
    {
        var user = await userRepository.FindByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        user.IsOnline = false;
        await userRepository.UpdateAsync(user);
    }

    public string GenerateJwtToken(int userId, string email, string username)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var jwtSettings = config.GetSection("JwtSettings");
        var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"] ?? "60");
        var secretKey = Encoding.UTF8.GetBytes(jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is required"));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(secretKey),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }

    private static string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    private static string HashRefreshToken(string token)
    {
        var bytes = Encoding.UTF8.GetBytes(token);
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);
    }
    
    private DateTime GetRefreshTokenExpiry()
    {
        var jwtSettings = config.GetSection("JwtSettings");
        var refreshTokenExpiryDays = int.Parse(jwtSettings["RefreshTokenExpiryDays"] ?? "7");
        return DateTime.UtcNow.AddDays(refreshTokenExpiryDays);
    }
}