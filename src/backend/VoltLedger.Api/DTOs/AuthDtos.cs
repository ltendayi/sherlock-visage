using System.ComponentModel.DataAnnotations;

namespace VoltLedger.Api.DTOs
{
    public class LoginRequestDto
    {
        [Required]
        [RegularExpression(@"^254[0-9]{9}$", ErrorMessage = "Phone number must be in Kenyan format: 2547XXXXXXXX")]
        public string PhoneNumber { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequestDto
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string FullName { get; set; } = string.Empty;
        
        [Required]
        [RegularExpression(@"^254[0-9]{9}$", ErrorMessage = "Phone number must be in Kenyan format: 2547XXXXXXXX")]
        public string PhoneNumber { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string? IdNumber { get; set; }
        
        public DateTime? DateOfBirth { get; set; }
        
        public string? HomeCounty { get; set; }
        
        public string? HomeWard { get; set; }
        
        public bool MpesaConsent { get; set; } = false;
    }

    public class AuthResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
    }

    public class UserDto
    {
        public Guid UserId { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool PhoneVerified { get; set; }
        public string? HomeCounty { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class RefreshTokenRequestDto
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
