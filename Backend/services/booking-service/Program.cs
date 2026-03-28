using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Runtime.InteropServices;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
using PdfSharp;
using PdfSharp.Drawing;
using PdfSharp.Fonts;
using PdfSharp.Pdf;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddInMemoryCollection(LoadDotEnv(builder.Environment.ContentRootPath));
GlobalFontSettings.UseWindowsFontsUnderWindows = true;
GlobalFontSettings.FontResolver ??= new EventZenFontResolver();

var configuration = builder.Configuration;
var mongoConnectionString = configuration["MONGODB_URI"] ?? "mongodb://localhost:27017/eventzen_bookings";
var bookingDatabaseName = configuration["BOOKING_DATABASE_NAME"] ?? "eventzen_bookings";
var eventServiceUrl = configuration["EVENT_SERVICE_URL"] ?? "http://localhost:3002/api/v1";
var authServiceUrl = configuration["AUTH_SERVICE_URL"] ?? "http://localhost:8081/api/v1";
var jwtPublicKey = configuration["JWT_PUBLIC_KEY"] ?? string.Empty;
var dummyRazorpayKey = configuration["DUMMY_RAZORPAY_KEY"] ?? "rzp_test_eventzen_dummy";
var environmentName = configuration["ASPNETCORE_ENVIRONMENT"] ?? builder.Environment.EnvironmentName;
var isDevelopment = string.Equals(environmentName, "Development", StringComparison.OrdinalIgnoreCase);
var jwtSkipVerificationSetting = configuration["JWT_SKIP_VERIFICATION"];
var jwtSkipVerification = string.IsNullOrWhiteSpace(jwtSkipVerificationSetting)
    ? isDevelopment || string.IsNullOrWhiteSpace(jwtPublicKey)
    : bool.TryParse(jwtSkipVerificationSetting, out var skipVerification) && skipVerification;
var allowedOrigins = (configuration["ALLOWED_ORIGINS"] ?? "http://localhost:5173,http://localhost:5174,http://localhost:3000")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
var port = int.TryParse(configuration["PORT"], out var configuredPort) ? configuredPort : 5050;

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

builder.Services.AddSingleton(new JwtReaderOptions(jwtPublicKey, jwtSkipVerification));
builder.Services.AddSingleton(new BookingServiceOptions(dummyRazorpayKey));
builder.Services.AddSingleton<JwtUserReader>();
builder.Services.AddSingleton(sp =>
{
    var client = new MongoClient(mongoConnectionString);
    var database = client.GetDatabase(bookingDatabaseName);
    return new BookingMongoContext(
        database.GetCollection<BookingDocument>("bookings"),
        database.GetCollection<PaymentAuditDocument>("booking_payment_audits"));
});
builder.Services.AddSingleton<TicketPdfBuilder>();
builder.Services.AddHttpClient<EventCatalogClient>(client =>
{
    client.BaseAddress = new Uri(eventServiceUrl.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddHttpClient<AuthIntrospectionClient>(client =>
{
    client.BaseAddress = new Uri(authServiceUrl.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(10);
});

var app = builder.Build();

app.UseCors("frontend");

app.MapGet("/health", () => Results.Ok(new
{
    success = true,
    service = "booking-service",
    timestampUtc = DateTime.UtcNow
}));

var bookingApi = app.MapGroup("/api/v1/bookings");

bookingApi.MapPost("/checkout-session", async (
    HttpContext httpContext,
    CheckoutSessionRequest request,
    JwtUserReader jwtUserReader,
    EventCatalogClient eventCatalogClient,
    BookingMongoContext mongoContext,
    BookingServiceOptions bookingOptions,
    CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(request.EventId))
    {
        return Results.BadRequest(ApiResponse.Fail("INVALID_EVENT", "Event id is required"));
    }

    var user = await jwtUserReader.ReadUserAsync(httpContext.Request.Headers.Authorization!, cancellationToken);
    if (!user.Success)
    {
        return Results.Json(user.Error!, statusCode: user.StatusCode);
    }

    var eventResult = await eventCatalogClient.GetEventAsync(request.EventId, httpContext.Request.Headers.Authorization!, cancellationToken);
    if (!eventResult.Success)
    {
        return Results.Json(eventResult.Error!, statusCode: eventResult.StatusCode);
    }

    var eventData = eventResult.Event!;
    var amount = request.Amount > 0 ? request.Amount : CalculateDefaultAmount(eventData);
    if (amount <= 0)
    {
        amount = 999M;
    }

    var nowUtc = DateTime.UtcNow;
    var bookingId = Guid.NewGuid().ToString();
    var bookingReference = $"EZB-{nowUtc:yyyyMMdd}-{CreateShortCode(6)}";
    var orderId = $"order_{CreateShortCode(12).ToLowerInvariant()}";

    var booking = new BookingDocument
    {
        BookingId = bookingId,
        BookingReference = bookingReference,
        BookingStatus = BookingStatuses.PaymentPending,
        User = new BookingUserSnapshot
        {
            UserId = user.User!.UserId,
            Email = user.User.Email,
            Name = user.User.Name,
            Roles = user.User.Roles
        },
        Event = new BookingEventSnapshot
        {
            EventId = eventData.EventId,
            EventName = eventData.EventName,
            EventType = eventData.EventType,
            EventDateUtc = eventData.EventDateUtc,
            StartTime = eventData.StartTime,
            EndTime = eventData.EndTime,
            VenueName = eventData.VenueName,
            VenueCity = eventData.VenueCity,
            OrganizerName = eventData.OrganizerName,
            OrganizerEmail = eventData.OrganizerEmail
        },
        Payment = new BookingPaymentDetails
        {
            Amount = amount,
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "INR" : request.Currency.Trim().ToUpperInvariant(),
            Status = PaymentStatuses.Pending,
            Method = null,
            OrderId = orderId,
            PaymentId = null,
            RazorpayKey = bookingOptions.DummyRazorpayKey,
            PaidAtUtc = null
        },
        Ticket = new BookingTicketDetails
        {
            TicketCode = null,
            FileName = $"ticket-{bookingReference}.pdf",
            DownloadCount = 0
        },
        CreatedAtUtc = nowUtc,
        UpdatedAtUtc = nowUtc
    };

    await mongoContext.Bookings.InsertOneAsync(booking, cancellationToken: cancellationToken);

    return Results.Ok(ApiResponse.Ok("Dummy checkout session created", new
    {
        booking = BookingView.FromDocument(booking),
        checkout = new
        {
            provider = "Dummy Razorpay",
            methods = new[] { "RAZORPAY", "CASH" },
            razorpayKey = bookingOptions.DummyRazorpayKey,
            orderId,
            amount,
            currency = booking.Payment.Currency
        }
    }));
});

bookingApi.MapPost("/{bookingId}/confirm-payment", async (
    string bookingId,
    HttpContext httpContext,
    ConfirmPaymentRequest request,
    JwtUserReader jwtUserReader,
    BookingMongoContext mongoContext,
    CancellationToken cancellationToken) =>
{
    var user = await jwtUserReader.ReadUserAsync(httpContext.Request.Headers.Authorization!, cancellationToken);
    if (!user.Success)
    {
        return Results.Json(user.Error!, statusCode: user.StatusCode);
    }

    var booking = await mongoContext.Bookings.Find(x => x.BookingId == bookingId).FirstOrDefaultAsync(cancellationToken);
    if (booking is null)
    {
        return Results.NotFound(ApiResponse.Fail("BOOKING_NOT_FOUND", "Booking was not found"));
    }

    if (!IsAdmin(user.User!) && !string.Equals(booking.User.UserId, user.User!.UserId, StringComparison.OrdinalIgnoreCase))
    {
        return Results.Json(ApiResponse.Fail("UNAUTHORIZED_ACCESS", "You can only confirm your own booking"), statusCode: StatusCodes.Status403Forbidden);
    }

    if (string.Equals(booking.Payment.Status, PaymentStatuses.Paid, StringComparison.OrdinalIgnoreCase))
    {
        return Results.Ok(ApiResponse.Ok("Payment already confirmed", new
        {
            booking = BookingView.FromDocument(booking),
            ticketDownloadUrl = $"/api/v1/bookings/{booking.BookingId}/ticket"
        }));
    }

    var paymentMethod = NormalizePaymentMethod(request.PaymentMethod);
    if (paymentMethod is null)
    {
        return Results.BadRequest(ApiResponse.Fail("INVALID_PAYMENT_METHOD", "Payment method must be RAZORPAY or CASH"));
    }

    var nowUtc = DateTime.UtcNow;
    booking.BookingStatus = BookingStatuses.Confirmed;
    booking.Payment.Status = PaymentStatuses.Paid;
    booking.Payment.Method = paymentMethod;
    booking.Payment.PaymentId = $"pay_{CreateShortCode(14).ToLowerInvariant()}";
    booking.Payment.PaidAtUtc = nowUtc;
    booking.Ticket.TicketCode ??= $"EZT-{CreateShortCode(8)}";
    booking.Ticket.FileName = ResolveTicketFileName(booking.BookingReference, booking.Ticket.FileName);
    booking.UpdatedAtUtc = nowUtc;

    await mongoContext.Bookings.ReplaceOneAsync(x => x.Id == booking.Id, booking, cancellationToken: cancellationToken);

    var audit = new PaymentAuditDocument
    {
        BookingId = booking.BookingId,
        UserId = booking.User.UserId,
        EventId = booking.Event.EventId,
        PaymentStatus = booking.Payment.Status,
        PaymentMethod = booking.Payment.Method!,
        PaymentId = booking.Payment.PaymentId!,
        PaidAtUtc = booking.Payment.PaidAtUtc,
        CreatedAtUtc = nowUtc
    };

    await mongoContext.PaymentAudits.InsertOneAsync(audit, cancellationToken: cancellationToken);

    return Results.Ok(ApiResponse.Ok("Dummy payment confirmed", new
    {
        booking = BookingView.FromDocument(booking),
        ticketDownloadUrl = $"/api/v1/bookings/{booking.BookingId}/ticket"
    }));
});

bookingApi.MapGet("/my-bookings", async (
    HttpContext httpContext,
    JwtUserReader jwtUserReader,
    BookingMongoContext mongoContext,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var user = await jwtUserReader.ReadUserAsync(httpContext.Request.Headers.Authorization!, cancellationToken);
    if (!user.Success)
    {
        return Results.Json(user.Error!, statusCode: user.StatusCode);
    }

    var resolvedLimit = Math.Clamp(limit ?? 10, 1, 50);
    var bookings = await mongoContext.Bookings.Find(x => x.User.UserId == user.User!.UserId)
        .SortByDescending(x => x.Payment.PaidAtUtc)
        .ThenByDescending(x => x.CreatedAtUtc)
        .Limit(resolvedLimit)
        .ToListAsync(cancellationToken);

    return Results.Ok(ApiResponse.Ok("Bookings retrieved successfully", new
    {
        bookings = bookings.Select(BookingView.FromDocument)
    }));
});

bookingApi.MapGet("/admin/bookings", async (
    HttpContext httpContext,
    JwtUserReader jwtUserReader,
    BookingMongoContext mongoContext,
    int? limit,
    CancellationToken cancellationToken) =>
{
    var user = await jwtUserReader.ReadUserAsync(httpContext.Request.Headers.Authorization!, cancellationToken);
    if (!user.Success)
    {
        return Results.Json(user.Error!, statusCode: user.StatusCode);
    }

    if (!IsAdmin(user.User!))
    {
        return Results.Json(ApiResponse.Fail("INSUFFICIENT_PERMISSIONS", "Admin access is required"), statusCode: StatusCodes.Status403Forbidden);
    }

    var resolvedLimit = Math.Clamp(limit ?? 20, 1, 100);
    var bookings = await mongoContext.Bookings.Find(FilterDefinition<BookingDocument>.Empty)
        .SortByDescending(x => x.Payment.PaidAtUtc)
        .ThenByDescending(x => x.CreatedAtUtc)
        .Limit(resolvedLimit)
        .ToListAsync(cancellationToken);

    return Results.Ok(ApiResponse.Ok("Admin bookings retrieved successfully", new
    {
        bookings = bookings.Select(BookingView.FromDocument)
    }));
});

bookingApi.MapGet("/{bookingId}/ticket", async (
    string bookingId,
    HttpContext httpContext,
    JwtUserReader jwtUserReader,
    BookingMongoContext mongoContext,
    TicketPdfBuilder ticketPdfBuilder,
    CancellationToken cancellationToken) =>
{
    var user = await jwtUserReader.ReadUserAsync(httpContext.Request.Headers.Authorization!, cancellationToken);
    if (!user.Success)
    {
        return Results.Json(user.Error!, statusCode: user.StatusCode);
    }

    var booking = await mongoContext.Bookings.Find(x => x.BookingId == bookingId).FirstOrDefaultAsync(cancellationToken);
    if (booking is null)
    {
        return Results.NotFound(ApiResponse.Fail("BOOKING_NOT_FOUND", "Booking was not found"));
    }

    if (!IsAdmin(user.User!) && !string.Equals(booking.User.UserId, user.User!.UserId, StringComparison.OrdinalIgnoreCase))
    {
        return Results.Json(ApiResponse.Fail("UNAUTHORIZED_ACCESS", "You can only download your own ticket"), statusCode: StatusCodes.Status403Forbidden);
    }

    if (!string.Equals(booking.Payment.Status, PaymentStatuses.Paid, StringComparison.OrdinalIgnoreCase))
    {
        return Results.Json(ApiResponse.Fail("PAYMENT_PENDING", "Ticket is available only after payment confirmation"), statusCode: StatusCodes.Status409Conflict);
    }

    booking.Ticket.FileName = ResolveTicketFileName(booking.BookingReference, booking.Ticket.FileName);
    booking.Ticket.DownloadCount += 1;
    booking.UpdatedAtUtc = DateTime.UtcNow;
    await mongoContext.Bookings.ReplaceOneAsync(x => x.Id == booking.Id, booking, cancellationToken: cancellationToken);

    var pdf = ticketPdfBuilder.Build(booking);
    return Results.File(pdf, "application/pdf", booking.Ticket.FileName);
});

await EnsureIndexesAsync(app.Services.GetRequiredService<BookingMongoContext>());

app.Urls.Add($"http://0.0.0.0:{port}");
app.Run();

static decimal CalculateDefaultAmount(EventSnapshot eventData)
{
    if (eventData.BudgetMinAmount > 0)
    {
        return eventData.BudgetMinAmount;
    }

    if (eventData.BudgetMaxAmount > 0)
    {
        return eventData.BudgetMaxAmount;
    }

    return 999M;
}

static string CreateShortCode(int size)
{
    const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    Span<byte> buffer = stackalloc byte[size];
    RandomNumberGenerator.Fill(buffer);
    var chars = new char[size];

    for (var index = 0; index < size; index += 1)
    {
        chars[index] = alphabet[buffer[index] % alphabet.Length];
    }

    return new string(chars);
}

static string ResolveTicketFileName(string bookingReference, string? fileName)
{
    var fallback = $"ticket-{bookingReference}.pdf";
    var safeName = string.IsNullOrWhiteSpace(fileName)
        ? fallback
        : Path.GetFileName(fileName.Trim());

    if (string.IsNullOrWhiteSpace(safeName))
    {
        return fallback;
    }

    if (!safeName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
    {
        safeName = Path.ChangeExtension(safeName, ".pdf");
    }

    return string.IsNullOrWhiteSpace(safeName) ? fallback : safeName;
}

static Dictionary<string, string?> LoadDotEnv(string contentRootPath)
{
    var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
    var envPath = Path.Combine(contentRootPath, ".env");
    if (!File.Exists(envPath))
    {
        return values;
    }

    foreach (var rawLine in File.ReadAllLines(envPath))
    {
        var line = rawLine.Trim();
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
        {
            continue;
        }

        var separatorIndex = line.IndexOf('=');
        if (separatorIndex <= 0)
        {
            continue;
        }

        var key = line[..separatorIndex].Trim();
        var value = line[(separatorIndex + 1)..].Trim();
        if (value.Length >= 2 && value.StartsWith('"') && value.EndsWith('"'))
        {
            value = value[1..^1];
        }

        if (!string.IsNullOrWhiteSpace(key) && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
        {
            values[key] = value;
        }
    }

    return values;
}

static string? NormalizePaymentMethod(string? paymentMethod)
{
    var normalized = paymentMethod?.Trim().ToUpperInvariant();
    return normalized is "RAZORPAY" or "CASH" ? normalized : null;
}

static bool IsAdmin(JwtUser user)
{
    return user.Roles.Any(role =>
        string.Equals(role, "ADMIN", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(role, "SUPER_ADMIN", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(role, "ROLE_ADMIN", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(role, "ROLE_SUPER_ADMIN", StringComparison.OrdinalIgnoreCase));
}

static async Task EnsureIndexesAsync(BookingMongoContext context)
{
    var bookingIndexes = new[]
    {
        new CreateIndexModel<BookingDocument>(Builders<BookingDocument>.IndexKeys.Ascending(x => x.BookingId), new CreateIndexOptions { Unique = true, Name = "uq_booking_id" }),
        new CreateIndexModel<BookingDocument>(Builders<BookingDocument>.IndexKeys.Ascending(x => x.BookingReference), new CreateIndexOptions { Unique = true, Name = "uq_booking_reference" }),
        new CreateIndexModel<BookingDocument>(Builders<BookingDocument>.IndexKeys.Ascending("user.user_id"), new CreateIndexOptions { Name = "ix_booking_user_id" }),
        new CreateIndexModel<BookingDocument>(Builders<BookingDocument>.IndexKeys.Ascending("event.event_id"), new CreateIndexOptions { Name = "ix_booking_event_id" }),
        new CreateIndexModel<BookingDocument>(Builders<BookingDocument>.IndexKeys.Descending("payment.paid_at_utc"), new CreateIndexOptions { Name = "ix_booking_paid_at" })
    };

    var paymentAuditIndexes = new[]
    {
        new CreateIndexModel<PaymentAuditDocument>(Builders<PaymentAuditDocument>.IndexKeys.Ascending(x => x.BookingId), new CreateIndexOptions { Name = "ix_audit_booking_id" }),
        new CreateIndexModel<PaymentAuditDocument>(Builders<PaymentAuditDocument>.IndexKeys.Ascending(x => x.PaymentId), new CreateIndexOptions { Name = "ix_audit_payment_id" })
    };

    await context.Bookings.Indexes.CreateManyAsync(bookingIndexes);
    await context.PaymentAudits.Indexes.CreateManyAsync(paymentAuditIndexes);
}

sealed record CheckoutSessionRequest(string EventId, decimal Amount, string? Currency);
sealed record ConfirmPaymentRequest(string? PaymentMethod);

sealed record ApiResponse(bool Success, string Message, object? Data = null, string? Error = null)
{
    public static ApiResponse Ok(string message, object? data = null) => new(true, message, data);
    public static ApiResponse Fail(string error, string message) => new(false, message, null, error);
}

sealed record JwtReaderOptions(string PublicKey, bool SkipVerification);
sealed record BookingServiceOptions(string DummyRazorpayKey);

sealed class BookingMongoContext(
    IMongoCollection<BookingDocument> bookings,
    IMongoCollection<PaymentAuditDocument> paymentAudits)
{
    public IMongoCollection<BookingDocument> Bookings { get; } = bookings;
    public IMongoCollection<PaymentAuditDocument> PaymentAudits { get; } = paymentAudits;
}

sealed class JwtUserReader(JwtReaderOptions options, AuthIntrospectionClient authIntrospectionClient)
{
    private readonly JwtSecurityTokenHandler _handler = new();

    public async Task<JwtReadResult> ReadUserAsync(string authorizationHeader, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(authorizationHeader) || !authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return JwtReadResult.Fail(StatusCodes.Status401Unauthorized, ApiResponse.Fail("AUTH_TOKEN_MISSING", "Authorization header is required"));
        }

        var token = authorizationHeader["Bearer ".Length..].Trim();
        if (string.IsNullOrWhiteSpace(token))
        {
            return JwtReadResult.Fail(StatusCodes.Status401Unauthorized, ApiResponse.Fail("AUTH_TOKEN_MISSING", "JWT token is required"));
        }

        try
        {
            return JwtReadResult.Ok(CreateUserFromValues(options.SkipVerification
                ? ReadPayloadWithoutVerification(token)
                : ReadPayloadWithValidation(token)));
        }
        catch (SecurityTokenExpiredException)
        {
            return JwtReadResult.Fail(StatusCodes.Status401Unauthorized, ApiResponse.Fail("TOKEN_EXPIRED", "JWT token has expired"));
        }
        catch
        {
            try
            {
                var introspection = await authIntrospectionClient.IntrospectAsync(token, cancellationToken);
                if (introspection?.Active == true)
                {
                    return JwtReadResult.Ok(CreateUserFromIntrospection(introspection));
                }
            }
            catch
            {
                // Fall through to the shared invalid token response.
            }

            return JwtReadResult.Fail(StatusCodes.Status401Unauthorized, ApiResponse.Fail("INVALID_TOKEN", "Invalid JWT token"));
        }
    }

    private static JwtUser CreateUserFromValues(IDictionary<string, object?> values)
    {
        var roles = ExtractStringList(values, "roles");
        if (roles.Count == 0 && values.TryGetValue("role", out var roleValue) && roleValue is not null)
        {
            roles.Add(roleValue.ToString() ?? string.Empty);
        }

        var name = FirstString(values, "name", "given_name");
        if (string.IsNullOrWhiteSpace(name))
        {
            name = values.TryGetValue("email", out var emailValue)
                ? emailValue?.ToString()?.Split('@').FirstOrDefault()
                : null;
        }

        var user = new JwtUser(
            UserId: FirstString(values, "sub", "userId", "user_id") ?? string.Empty,
            Email: FirstString(values, "email") ?? string.Empty,
            Name: name ?? "EventZen User",
            Roles: roles.Where(role => !string.IsNullOrWhiteSpace(role)).ToArray());

        if (string.IsNullOrWhiteSpace(user.UserId))
        {
            throw new SecurityTokenException("User id claim was not found");
        }

        return user;
    }

    private static JwtUser CreateUserFromIntrospection(TokenIntrospectionPayload payload)
    {
        var values = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase)
        {
            ["sub"] = payload.Subject,
            ["email"] = payload.Email,
            ["name"] = payload.Name,
            ["given_name"] = payload.GivenName,
            ["roles"] = payload.Roles?.ToArray() ?? [],
        };

        return CreateUserFromValues(values);
    }

    private IDictionary<string, object?> ReadPayloadWithValidation(string token)
    {
        using var rsa = RSA.Create();
        var pem = options.PublicKey.Contains("BEGIN PUBLIC KEY", StringComparison.OrdinalIgnoreCase)
            ? options.PublicKey
            : $"-----BEGIN PUBLIC KEY-----\n{options.PublicKey}\n-----END PUBLIC KEY-----";
        rsa.ImportFromPem(pem);

        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new RsaSecurityKey(rsa),
            ClockSkew = TimeSpan.Zero
        };

        _handler.ValidateToken(token, parameters, out var validatedToken);
        var jwt = (JwtSecurityToken)validatedToken;
        return jwt.Claims
            .GroupBy(claim => claim.Type)
            .ToDictionary(
                group => group.Key,
                group => group.Count() == 1 ? (object?)group.First().Value : group.Select(claim => claim.Value).ToArray());
    }

    private IDictionary<string, object?> ReadPayloadWithoutVerification(string token)
    {
        if (!_handler.CanReadToken(token))
        {
            throw new SecurityTokenException("Invalid token");
        }

        var jwt = _handler.ReadJwtToken(token);
        if (jwt.ValidTo != DateTime.MinValue && jwt.ValidTo <= DateTime.UtcNow)
        {
            throw new SecurityTokenExpiredException();
        }

        var dictionary = jwt.Claims
            .GroupBy(claim => claim.Type)
            .ToDictionary(
                group => group.Key,
                group => group.Count() == 1 ? (object?)group.First().Value : group.Select(claim => claim.Value).ToArray(),
                StringComparer.OrdinalIgnoreCase);

        if (dictionary.Count > 0)
        {
            return dictionary;
        }

        var segments = token.Split('.');
        if (segments.Length < 2)
        {
            throw new SecurityTokenException("Invalid token");
        }

        var payloadBytes = Base64UrlEncoder.DecodeBytes(segments[1]);
        using var json = JsonDocument.Parse(payloadBytes);
        dictionary = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

        foreach (var property in json.RootElement.EnumerateObject())
        {
            dictionary[property.Name] = property.Value.ValueKind switch
            {
                JsonValueKind.Array => property.Value.EnumerateArray().Select(item => item.ToString()).ToArray(),
                JsonValueKind.String => property.Value.GetString(),
                JsonValueKind.Number => property.Value.ToString(),
                JsonValueKind.True => true,
                JsonValueKind.False => false,
                _ => property.Value.ToString()
            };
        }

        if (dictionary.TryGetValue("exp", out var expValue) &&
            long.TryParse(expValue?.ToString(), out var expSeconds) &&
            DateTimeOffset.FromUnixTimeSeconds(expSeconds) <= DateTimeOffset.UtcNow)
        {
            throw new SecurityTokenExpiredException();
        }

        return dictionary;
    }

    private static string? FirstString(IDictionary<string, object?> values, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (values.TryGetValue(key, out var value) && value is not null && !string.IsNullOrWhiteSpace(value.ToString()))
            {
                return value.ToString();
            }
        }

        return null;
    }

    private static List<string> ExtractStringList(IDictionary<string, object?> values, string key)
    {
        if (!values.TryGetValue(key, out var rawValue) || rawValue is null)
        {
            return [];
        }

        return rawValue switch
        {
            string rawString when !string.IsNullOrWhiteSpace(rawString) => [rawString],
            IEnumerable<string> items => items.Where(item => !string.IsNullOrWhiteSpace(item)).ToList(),
            IEnumerable<object> items => items.Select(item => item.ToString() ?? string.Empty).Where(item => !string.IsNullOrWhiteSpace(item)).ToList(),
            _ => []
        };
    }
}

sealed class AuthIntrospectionClient(HttpClient httpClient)
{
    public async Task<TokenIntrospectionPayload?> IntrospectAsync(string token, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "auth/introspect");
        request.Headers.Authorization = AuthenticationHeaderValue.Parse($"Bearer {token}");

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        return await response.Content.ReadFromJsonAsync<TokenIntrospectionPayload>(cancellationToken: cancellationToken);
    }
}

sealed class TokenIntrospectionPayload
{
    public bool Active { get; set; }
    public string? Subject { get; set; }
    public string? Email { get; set; }
    public List<string>? Roles { get; set; }
    public string? Name { get; set; }
    public string? GivenName { get; set; }
}

sealed record JwtReadResult(bool Success, int StatusCode, JwtUser? User = null, ApiResponse? Error = null)
{
    public static JwtReadResult Ok(JwtUser user) => new(true, StatusCodes.Status200OK, user);
    public static JwtReadResult Fail(int statusCode, ApiResponse error) => new(false, statusCode, null, error);
}

sealed record JwtUser(string UserId, string Email, string Name, IReadOnlyList<string> Roles);

sealed class EventCatalogClient(HttpClient httpClient)
{
    public async Task<EventFetchResult> GetEventAsync(string eventId, string authorizationHeader, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, $"events/{eventId}");
        request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader);

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return EventFetchResult.Fail((int)response.StatusCode, ApiResponse.Fail("EVENT_LOOKUP_FAILED", "Event lookup failed in event-service"));
        }

        var payload = await response.Content.ReadFromJsonAsync<EventServiceEnvelope>(cancellationToken: cancellationToken);
        if (payload?.Data?.Event is null)
        {
            return EventFetchResult.Fail(StatusCodes.Status404NotFound, ApiResponse.Fail("EVENT_NOT_FOUND", "Event not found"));
        }

        var source = payload.Data.Event;
        return EventFetchResult.Ok(new EventSnapshot(
            source.EventId ?? string.Empty,
            source.EventName ?? "Event",
            source.EventType ?? "event",
            source.EventDate ?? DateTime.UtcNow,
            source.StartTime ?? "00:00",
            source.EndTime ?? "00:00",
            source.VenueSnapshot?.VenueName ?? "Venue",
            source.VenueSnapshot?.City ?? string.Empty,
            source.Organizer?.Name ?? string.Empty,
            source.Organizer?.Email ?? string.Empty,
            source.Budget?.MinAmount ?? 0,
            source.Budget?.MaxAmount ?? 0));
    }
}

sealed record EventFetchResult(bool Success, int StatusCode, EventSnapshot? Event = null, ApiResponse? Error = null)
{
    public static EventFetchResult Ok(EventSnapshot eventData) => new(true, StatusCodes.Status200OK, eventData);
    public static EventFetchResult Fail(int statusCode, ApiResponse error) => new(false, statusCode, null, error);
}

sealed record EventSnapshot(
    string EventId,
    string EventName,
    string EventType,
    DateTime EventDateUtc,
    string StartTime,
    string EndTime,
    string VenueName,
    string VenueCity,
    string OrganizerName,
    string OrganizerEmail,
    decimal BudgetMinAmount,
    decimal BudgetMaxAmount);

sealed class TicketPdfBuilder
{
    public byte[] Build(BookingDocument booking)
    {
        var paidAt = booking.Payment.PaidAtUtc?.ToString("dd MMM yyyy, hh:mm tt 'UTC'") ?? "-";
        var lines = new[]
        {
            "EventZen Ticket",
            $"Booking Reference: {booking.BookingReference}",
            $"Ticket Code: {booking.Ticket.TicketCode ?? "-"}",
            string.Empty,
            $"Event: {booking.Event.EventName}",
            $"Attendee: {booking.User.Name}",
            $"Venue: {booking.Event.VenueName}",
            $"Date: {booking.Event.EventDateUtc:dd MMM yyyy}",
            $"Time: {booking.Event.StartTime} - {booking.Event.EndTime}",
            $"Payment Status: {booking.Payment.Status}",
            $"Paid At: {paidAt}",
            string.Empty,
            "Present this ticket code at entry.",
            "Generated by EventZen booking-service after payment confirmation."
        };

        using var document = new PdfDocument();
        document.Info.Title = $"EventZen Ticket {booking.BookingReference}";
        document.Info.Author = "EventZen Booking Service";

        var page = document.AddPage();
        page.Size = PageSize.A4;
        page.Orientation = PageOrientation.Portrait;

        using var graphics = XGraphics.FromPdfPage(page);
        var titleFont = new XFont("EventZen Sans", 20, XFontStyleEx.Bold);
        var bodyFont = new XFont("EventZen Sans", 12, XFontStyleEx.Regular);

        double y = 48;
        graphics.DrawString("EventZen Ticket", titleFont, XBrushes.Black, new XPoint(40, y));
        y += 34;

        foreach (var line in lines.Skip(1))
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                y += 10;
                continue;
            }

            graphics.DrawString(line, bodyFont, XBrushes.Black, new XPoint(40, y));
            y += 22;
        }

        using var stream = new MemoryStream();
        document.Save(stream, false);
        return stream.ToArray();
    }
}

sealed class EventZenFontResolver : IFontResolver
{
    private const string RegularFace = "EventZenSans-Regular";
    private const string BoldFace = "EventZenSans-Bold";
    private const string ItalicFace = "EventZenSans-Italic";
    private const string BoldItalicFace = "EventZenSans-BoldItalic";

    public string DefaultFontName => "EventZen Sans";

    public byte[]? GetFont(string faceName)
    {
        var path = faceName switch
        {
            RegularFace => ResolveFontPath("DejaVuSans.ttf", "arial.ttf"),
            BoldFace => ResolveFontPath("DejaVuSans-Bold.ttf", "arialbd.ttf"),
            ItalicFace => ResolveFontPath("DejaVuSans-Oblique.ttf", "ariali.ttf"),
            BoldItalicFace => ResolveFontPath("DejaVuSans-BoldOblique.ttf", "arialbi.ttf"),
            _ => null
        };

        return path is not null && File.Exists(path) ? File.ReadAllBytes(path) : null;
    }

    public FontResolverInfo? ResolveTypeface(string familyName, bool isBold, bool isItalic)
    {
        var normalizedFamily = (familyName ?? string.Empty).Trim().ToLowerInvariant();
        var supportedFamily =
            normalizedFamily is "eventzen sans" or "dejavu sans" or "arial" || string.IsNullOrWhiteSpace(normalizedFamily);

        if (!supportedFamily)
        {
          return new FontResolverInfo(RegularFace);
        }

        if (isBold && isItalic) return new FontResolverInfo(BoldItalicFace);
        if (isBold) return new FontResolverInfo(BoldFace);
        if (isItalic) return new FontResolverInfo(ItalicFace);
        return new FontResolverInfo(RegularFace);
    }

    private static string? ResolveFontPath(string linuxFileName, string windowsFileName)
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            var windowsFonts = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.Windows),
                "Fonts",
                windowsFileName);
            return File.Exists(windowsFonts) ? windowsFonts : null;
        }

        var linuxFonts = Path.Combine("/usr/share/fonts/truetype/dejavu", linuxFileName);
        return File.Exists(linuxFonts) ? linuxFonts : null;
    }
}

sealed class BookingView
{
    public required string BookingId { get; init; }
    public required string BookingReference { get; init; }
    public required string BookingStatus { get; init; }
    public required BookingUserSnapshot User { get; init; }
    public required BookingEventSnapshot Event { get; init; }
    public required BookingPaymentDetails Payment { get; init; }
    public required BookingTicketDetails Ticket { get; init; }
    public required DateTime CreatedAtUtc { get; init; }
    public required DateTime UpdatedAtUtc { get; init; }
    public required string TicketDownloadUrl { get; init; }

    public static BookingView FromDocument(BookingDocument document) => new()
    {
        BookingId = document.BookingId,
        BookingReference = document.BookingReference,
        BookingStatus = document.BookingStatus,
        User = document.User,
        Event = document.Event,
        Payment = document.Payment,
        Ticket = document.Ticket,
        CreatedAtUtc = document.CreatedAtUtc,
        UpdatedAtUtc = document.UpdatedAtUtc,
        TicketDownloadUrl = $"/api/v1/bookings/{document.BookingId}/ticket"
    };
}

sealed class BookingDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("booking_id")]
    public required string BookingId { get; set; }

    [BsonElement("booking_reference")]
    public required string BookingReference { get; set; }

    [BsonElement("booking_status")]
    public required string BookingStatus { get; set; }

    [BsonElement("user")]
    public required BookingUserSnapshot User { get; set; }

    [BsonElement("event")]
    public required BookingEventSnapshot Event { get; set; }

    [BsonElement("payment")]
    public required BookingPaymentDetails Payment { get; set; }

    [BsonElement("ticket")]
    public required BookingTicketDetails Ticket { get; set; }

    [BsonElement("created_at_utc")]
    public DateTime CreatedAtUtc { get; set; }

    [BsonElement("updated_at_utc")]
    public DateTime UpdatedAtUtc { get; set; }
}

sealed class BookingUserSnapshot
{
    [BsonElement("user_id")]
    public required string UserId { get; set; }

    [BsonElement("email")]
    public required string Email { get; set; }

    [BsonElement("name")]
    public required string Name { get; set; }

    [BsonElement("roles")]
    public required IReadOnlyList<string> Roles { get; set; }
}

sealed class BookingEventSnapshot
{
    [BsonElement("event_id")]
    public required string EventId { get; set; }

    [BsonElement("event_name")]
    public required string EventName { get; set; }

    [BsonElement("event_type")]
    public required string EventType { get; set; }

    [BsonElement("event_date_utc")]
    public DateTime EventDateUtc { get; set; }

    [BsonElement("start_time")]
    public required string StartTime { get; set; }

    [BsonElement("end_time")]
    public required string EndTime { get; set; }

    [BsonElement("venue_name")]
    public required string VenueName { get; set; }

    [BsonElement("venue_city")]
    public required string VenueCity { get; set; }

    [BsonElement("organizer_name")]
    public required string OrganizerName { get; set; }

    [BsonElement("organizer_email")]
    public required string OrganizerEmail { get; set; }
}

sealed class BookingPaymentDetails
{
    [BsonElement("amount")]
    public decimal Amount { get; set; }

    [BsonElement("currency")]
    public required string Currency { get; set; }

    [BsonElement("status")]
    public required string Status { get; set; }

    [BsonElement("method")]
    public string? Method { get; set; }

    [BsonElement("order_id")]
    public required string OrderId { get; set; }

    [BsonElement("payment_id")]
    public string? PaymentId { get; set; }

    [BsonElement("razorpay_key")]
    public required string RazorpayKey { get; set; }

    [BsonElement("paid_at_utc")]
    public DateTime? PaidAtUtc { get; set; }
}

sealed class BookingTicketDetails
{
    [BsonElement("ticket_code")]
    public string? TicketCode { get; set; }

    [BsonElement("file_name")]
    public required string FileName { get; set; }

    [BsonElement("download_count")]
    public int DownloadCount { get; set; }
}

sealed class PaymentAuditDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("booking_id")]
    public required string BookingId { get; set; }

    [BsonElement("user_id")]
    public required string UserId { get; set; }

    [BsonElement("event_id")]
    public required string EventId { get; set; }

    [BsonElement("payment_status")]
    public required string PaymentStatus { get; set; }

    [BsonElement("payment_method")]
    public required string PaymentMethod { get; set; }

    [BsonElement("payment_id")]
    public required string PaymentId { get; set; }

    [BsonElement("paid_at_utc")]
    public DateTime? PaidAtUtc { get; set; }

    [BsonElement("created_at_utc")]
    public DateTime CreatedAtUtc { get; set; }
}

static class BookingStatuses
{
    public const string PaymentPending = "PAYMENT_PENDING";
    public const string Confirmed = "CONFIRMED";
}

static class PaymentStatuses
{
    public const string Pending = "PENDING";
    public const string Paid = "PAID";
}

sealed class EventServiceEnvelope
{
    public EventServiceEnvelopeData? Data { get; set; }
}

sealed class EventServiceEnvelopeData
{
    public EventServiceEvent? Event { get; set; }
}

sealed class EventServiceEvent
{
    [JsonPropertyName("event_id")]
    public string? EventId { get; set; }

    [JsonPropertyName("event_name")]
    public string? EventName { get; set; }

    [JsonPropertyName("event_type")]
    public string? EventType { get; set; }

    [JsonPropertyName("event_date")]
    public DateTime? EventDate { get; set; }

    [JsonPropertyName("start_time")]
    public string? StartTime { get; set; }

    [JsonPropertyName("end_time")]
    public string? EndTime { get; set; }

    [JsonPropertyName("budget")]
    public EventServiceBudget? Budget { get; set; }

    [JsonPropertyName("organizer")]
    public EventServiceOrganizer? Organizer { get; set; }

    [JsonPropertyName("venue_snapshot")]
    public EventServiceVenueSnapshot? VenueSnapshot { get; set; }
}

sealed class EventServiceBudget
{
    [JsonPropertyName("min_amount")]
    public decimal? MinAmount { get; set; }

    [JsonPropertyName("max_amount")]
    public decimal? MaxAmount { get; set; }
}

sealed class EventServiceOrganizer
{
    public string? Name { get; set; }
    public string? Email { get; set; }
}

sealed class EventServiceVenueSnapshot
{
    [JsonPropertyName("venue_name")]
    public string? VenueName { get; set; }

    [JsonPropertyName("city")]
    public string? City { get; set; }
}
