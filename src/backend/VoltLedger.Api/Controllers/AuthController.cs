using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Supabase;
using VoltLedger.Api.Data;
using VoltLedger.Api.DTOs;
using VoltLedger.Api.Models;
using VoltLedger.Api.Services;

namespace VoltLedger.Api.Controllers
{
    /// <summary>
    /// Authentication controller for user login, registration, and token management
    /// Integrates with Supabase Auth for JWT handling
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly Client _supabase;
        private readonly IJwtService _jwtService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            ApplicationDbContext dbContext,
            Client supabase,
            IJwtService jwtService,
            ILogger<AuthController> logger)
        {
            _dbContext = dbContext;
            _supabase = supabase;
            _jwtService = jwtService;
            _logger = logger;
        }

        /// <summary>
        /// Register a new user
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterRequestDto request)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _dbContext.Users
                    .FirstOrDefaultAsync(u => u.PhoneNumber == request.PhoneNumber);

                if (existingUser != null)
                {
                    return BadRequest(ApiResponse<AuthResponseDto>.Error(
                        "User with this phone number already exists"));
                }

                // Create Supabase Auth user
                var authResponse = await _supabase.Auth.SignUp(
                    request.PhoneNumber + "@voltledger.local", // Use phone as email for Supabase
                    request.Password);

                if (authResponse.User == null)
                {
                    return BadRequest(ApiResponse<AuthResponseDto>.Error(
                        "Failed to create user account"));
                }

                // Create local user record
                var user = new User
                {
                    UserId = Guid.Parse(authResponse.User.Id!),
                    PhoneNumber = request.PhoneNumber,
                    FullName = request.FullName,
                    IdNumber = request.IdNumber,
                    DateOfBirth = request.DateOfBirth,
                    HomeCounty = request.HomeCounty,
                    HomeWard = request.HomeWard,
                    MpesaConsent = request.MpesaConsent,
                    Role = UserRole.rider,
                    CreatedAt = DateTime.UtcNow
                };

                _dbContext.Users.Add(user);
                await _dbContext.SaveChangesAsync();

                // Generate JWT
                var token = _jwtService.GenerateToken(user);
                var refreshToken = _jwtService.GenerateRefreshToken();

                var response = new AuthResponseDto
                {
                    Token = token,
                    RefreshToken = refreshToken,
                    User = MapToUserDto(user),
                    ExpiresAt = _jwtService.GetTokenExpiry()
                };

                _logger.LogInformation("User registered: {PhoneNumber}", request.PhoneNumber);

                return CreatedAtAction(nameof(Profile), new { }, 
                    ApiResponse<AuthResponseDto>.Created(response, "User registered successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering user: {PhoneNumber}", request.PhoneNumber);
                return StatusCode(500, ApiResponse<AuthResponseDto>.Error(
                    "An error occurred while registering user"));
            }
        }

        /// <summary>
        /// Login with phone number and password
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                // Authenticate with Supabase
                var authResponse = await _supabase.Auth.SignIn(
                    request.PhoneNumber + "@voltledger.local",
                    request.Password);

                if (authResponse.User == null)
                {
                    return Unauthorized(ApiResponse<AuthResponseDto>.Unauthorized(
                        "Invalid phone number or password"));
                }

                // Get local user record
                var userId = Guid.Parse(authResponse.User.Id!);
                var user = await _dbContext.Users.FindAsync(userId);

                if (user == null)
                {
                    return Unauthorized(ApiResponse<AuthResponseDto>.Unauthorized(
                        "User account not found"));
                }

                // Update last login
                user.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();

                // Generate JWT
                var token = _jwtService.GenerateToken(user);
                var refreshToken = _jwtService.GenerateRefreshToken();

                var response = new AuthResponseDto
                {
                    Token = token,
                    RefreshToken = refreshToken,
                    User = MapToUserDto(user),
                    ExpiresAt = _jwtService.GetTokenExpiry()
                };

                _logger.LogInformation("User logged in: {PhoneNumber}", request.PhoneNumber);

                return Ok(ApiResponse<AuthResponseDto>.Ok(response, "Login successful"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging in user: {PhoneNumber}", request.PhoneNumber);
                return StatusCode(500, ApiResponse<AuthResponseDto>.Error(
                    "An error occurred while logging in"));
            }
        }

        /// <summary>
        /// Refresh access token
        /// </summary>
        [HttpPost("refresh")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken(
            [FromBody] RefreshTokenRequestDto request)
        {
            try
            {
                // Validate refresh token via Supabase
                var session = await _supabase.Auth.SetSession(
                    request.RefreshToken, 
                    request.RefreshToken);

                if (session.User == null)
                {
                    return Unauthorized(ApiResponse<AuthResponseDto>.Unauthorized("Invalid refresh token"));
                }

                var userId = Guid.Parse(session.User.Id!);
                var user = await _dbContext.Users.FindAsync(userId);

                if (user == null)
                {
                    return Unauthorized(ApiResponse<AuthResponseDto>.Unauthorized("User not found"));
                }

                var token = _jwtService.GenerateToken(user);
                var newRefreshToken = _jwtService.GenerateRefreshToken();

                var response = new AuthResponseDto
                {
                    Token = token,
                    RefreshToken = newRefreshToken,
                    User = MapToUserDto(user),
                    ExpiresAt = _jwtService.GetTokenExpiry()
                };

                return Ok(ApiResponse<AuthResponseDto>.Ok(response, "Token refreshed"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing token");
                return Unauthorized(ApiResponse<AuthResponseDto>.Unauthorized("Invalid refresh token"));
            }
        }

        /// <summary>
        /// Get current user profile
        /// </summary>
        [HttpGet("profile")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<UserDto>>> Profile()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
            {
                return Unauthorized(ApiResponse<UserDto>.Unauthorized());
            }

            var user = await _dbContext.Users.FindAsync(userId.Value);
            if (user == null)
            {
                return NotFound(ApiResponse<UserDto>.NotFound("User not found"));
            }

            return Ok(ApiResponse<UserDto>.Ok(MapToUserDto(user)));
        }

        /// <summary>
        /// Logout current user
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse>> Logout()
        {
            try
            {
                await _supabase.Auth.SignOut();
                return Ok(ApiResponse.Ok("Logged out successfully"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during logout");
                return Ok(ApiResponse.Ok("Logged out")); // Still return OK to client
            }
        }

        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return null;
        }

        private static UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                UserId = user.UserId,
                PhoneNumber = user.PhoneNumber,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                PhoneVerified = user.PhoneVerified,
                HomeCounty = user.HomeCounty,
                CreatedAt = user.CreatedAt
            };
        }
    }
}
