# Multi-stage Docker build for .NET 9.0 API
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Install ICU libraries for SQL Server client (Globalization support)
RUN apk add --no-cache icu-libs icu-data-full
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

# Create non-root user for security
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser

FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
WORKDIR /src

# Copy project files for dependency resolution
COPY ["src/GatherGrove.API/GatherGrove.API.csproj", "src/GatherGrove.API/"]
COPY ["src/GatherGrove.Application/GatherGrove.Application.csproj", "src/GatherGrove.Application/"]
COPY ["src/GatherGrove.Infrastructure/GatherGrove.Infrastructure.csproj", "src/GatherGrove.Infrastructure/"]
COPY ["src/GatherGrove.Domain/GatherGrove.Domain.csproj", "src/GatherGrove.Domain/"]

# Restore dependencies
RUN dotnet restore "src/GatherGrove.API/GatherGrove.API.csproj"

# Copy source code
COPY . .

# Build the application
WORKDIR "/src/src/GatherGrove.API"
RUN dotnet build "GatherGrove.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "GatherGrove.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

# Health check - uses the API v1 health endpoint
# Using 127.0.0.1 instead of localhost to avoid IPv6 resolution issues in Alpine
HEALTHCHECK --interval=5m --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/api/v1/health || exit 1

ENTRYPOINT ["dotnet", "GatherGrove.API.dll"]