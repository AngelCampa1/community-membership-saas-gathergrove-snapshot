// Quick debug test
var options = new DbContextOptionsBuilder<GatherGroveDbContext>()
    .UseInMemoryDatabase(databaseName: "DebugTest")
    .Options;

using var context = new GatherGroveDbContext(options);

var eventEntity = new Event
{
    Id = 1,
    ClubId = 1,
    Name = "Test",
    EventDateTime = DateTime.UtcNow,
    Location = "Test",
    PaymentToken = "test_token"
};

context.Events.Add(eventEntity);
await context.SaveChangesAsync();

Console.WriteLine($"Entity added with token: {eventEntity.PaymentToken}");

// Query it back
var found = await context.Events.FirstOrDefaultAsync(e => e.PaymentToken == "test_token");
Console.WriteLine($"Found: {found != null}, Token: {found?.PaymentToken}");
