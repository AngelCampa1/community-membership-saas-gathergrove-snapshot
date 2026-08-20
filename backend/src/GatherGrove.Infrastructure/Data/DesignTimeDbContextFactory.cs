using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace GatherGrove.Infrastructure.Data;

/// <summary>
/// Factory for creating DbContext instances at design time for migrations
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<GatherGroveDbContext>
{
    public GatherGroveDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<GatherGroveDbContext>();

        // Use SQL Server for migrations (not in-memory)
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=GatherGroveDb;Username=postgres;Password=postgres";

        optionsBuilder.UseNpgsql(connectionString);

        return new GatherGroveDbContext(optionsBuilder.Options);
    }
}