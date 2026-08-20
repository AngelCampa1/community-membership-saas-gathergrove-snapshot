# GatherGrove Backend

This is the backend solution for the GatherGrove application, built with .NET 9, ASP.NET Core, Entity Framework Core, and SQL Server.

## Project Structure

```
backend/
├── src/
│   ├── GatherGrove.API/           # Web API layer
│   ├── GatherGrove.Application/   # Application/Business logic layer
│   ├── GatherGrove.Domain/        # Domain entities and business rules
│   └── GatherGrove.Infrastructure/ # Data access and external services
├── tests/
│   ├── GatherGrove.API.Tests/     # API layer unit tests
│   └── GatherGrove.Application.Tests/ # Application layer unit tests
└── GatherGrove.sln                # Solution file
```

## Technology Stack

- **.NET 9.0** - Framework
- **ASP.NET Core** - Web API framework
- **Entity Framework Core** - ORM for data access
- **SQL Server** - Database (LocalDB for development)
- **Swagger/OpenAPI** - API documentation
- **FluentValidation** - Server-side validation
- **NUnit** - Testing framework
- **Moq** - Mocking framework for unit tests
- **Coverlet** - Code coverage collection

## Getting Started

### Prerequisites

- .NET 9.0 SDK
- SQL Server LocalDB (included with Visual Studio)

### Running the Application

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

3. Build the solution:
   ```bash
   dotnet build
   ```

4. Run the API:
   ```bash
   dotnet run --project src/GatherGrove.API
   ```

5. Open your browser and navigate to `https://localhost:5001` to access the Swagger UI.

### API Endpoints

- **Health Check**: `GET /api/v1/health` - Basic health check endpoint

## Testing and Code Coverage

The solution includes comprehensive unit tests with code coverage reporting.

### Prerequisites for Coverage

Install the ReportGenerator global tool (one-time setup):
```bash
dotnet tool install --global dotnet-reportgenerator-globaltool
```

### Running Tests

#### Basic Test Execution
```bash
# Run all tests
dotnet test

# Run tests with verbose output
dotnet test --verbosity normal

# Run tests for a specific project
dotnet test tests/GatherGrove.Application.Tests
```

#### Code Coverage

##### Option 1: Using the Coverage Scripts (Recommended)

**Windows (PowerShell):**
```powershell
.\run-coverage.ps1
```

**Linux/macOS (Bash):**
```bash
./run-coverage.sh
```

##### Option 2: Manual Commands

**Step 1: Run tests with coverage collection**
```bash
dotnet test --collect:"XPlat Code Coverage" --results-directory:"TestResults"
```

**Step 2: Generate HTML coverage report**
```bash
# Windows
reportgenerator -reports:"TestResults\*\*.cobertura.xml" -targetdir:"TestResults\Coverage" -reporttypes:"Html;Cobertura" -title:"GatherGrove Backend Coverage Report"

# Linux/macOS
reportgenerator -reports:"TestResults/*/coverage.cobertura.xml" -targetdir:"TestResults/Coverage" -reporttypes:"Html;Cobertura" -title:"GatherGrove Backend Coverage Report"
```

**Step 3: View the report**
Open `TestResults/Coverage/index.html` in your browser to view the detailed coverage report.

### Coverage Reports

The coverage reports include:
- **Line Coverage**: Percentage of code lines executed by tests
- **Branch Coverage**: Percentage of conditional branches tested
- **Method Coverage**: Percentage of methods called by tests
- **Class Coverage**: Percentage of classes with at least one method tested

### Coverage Targets

**Current Coverage Status:**
- **Line Coverage**: 88.4% (261 of 295 lines covered)
- **Branch Coverage**: 65% (13 of 20 branches covered)
- **Target**: 80% minimum line coverage ✅
- **Recommended**: 90% line coverage for critical business logic

**Coverage Exclusions:**
- Database migrations (automatically excluded)
- Generated code and model snapshots
- Configuration files and startup code

**Per-Layer Coverage:**
- **API Layer**: 77.8% line coverage
- **Application Layer**: 90.4% line coverage ⭐
- **Domain Layer**: 95% line coverage ⭐
- **Infrastructure Layer**: 100% line coverage ⭐

### Coverage Files Generated

- `TestResults/Coverage/index.html` - Main HTML coverage report
- `TestResults/Coverage/Cobertura.xml` - Machine-readable coverage data
- Individual class/method coverage details

### Continuous Integration

For CI/CD pipelines, use:
```bash
# Generate coverage in CI-friendly formats
dotnet test --collect:"XPlat Code Coverage" --logger:"trx;LogFileName=test-results.trx" --results-directory:"TestResults"

# Generate multiple report formats
reportgenerator -reports:"TestResults/*/*.cobertura.xml" -targetdir:"TestResults/Coverage" -reporttypes:"Html;Cobertura;JsonSummary"
```

## Development

The solution follows Clean Architecture principles with clear separation of concerns:

- **API Layer**: Controllers, DTOs, and API configuration
- **Application Layer**: Business logic, services, and application-specific logic
- **Domain Layer**: Core business entities and domain logic
- **Infrastructure Layer**: Data access, external services, and infrastructure concerns

## Database

The application uses Entity Framework Core with SQL Server LocalDB for development. The connection string is configured in `appsettings.Development.json`.

## Documentation

API documentation is automatically generated using Swagger/OpenAPI and is available at the root URL when running in development mode. 