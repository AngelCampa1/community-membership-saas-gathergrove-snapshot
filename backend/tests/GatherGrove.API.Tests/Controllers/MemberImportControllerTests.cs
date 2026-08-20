using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.API.Controllers;
using GatherGrove.Application.Services;
using GatherGrove.Application.DTOs.Import;

namespace GatherGrove.API.Tests.Controllers;

[TestFixture]
public class MemberImportControllerTests
{
    private MemberImportController _controller;
    private Mock<IMemberImportService> _mockImportService;
    private Mock<IClubAuthorizationService> _mockAuthService;
    private Mock<ILogger<MemberImportController>> _mockLogger;

    [SetUp]
    public void SetUp()
    {
        _mockImportService = new Mock<IMemberImportService>();
        _mockAuthService = new Mock<IClubAuthorizationService>();
        _mockLogger = new Mock<ILogger<MemberImportController>>();

        _controller = new MemberImportController(
            _mockImportService.Object,
            _mockAuthService.Object,
            _mockLogger.Object);

        // Set up controller context with authenticated user
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "1"),
            new Claim("email", "test@example.com"),
            new Claim("club_id", "1")
        };
        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = principal
            }
        };

        // Mock authorization service
        _mockAuthService.Setup(x => x.GetUserIdFromClaims(It.IsAny<ClaimsPrincipal>()))
            .Returns(1);
        _mockAuthService.Setup(x => x.CanAccessClubAsAdminAsync(It.IsAny<ClaimsPrincipal>(), It.IsAny<int>()))
            .ReturnsAsync(true);
    }

    #region Download Template Tests

    [Test]
    public async Task DownloadTemplate_WithValidClubId_ShouldReturnFileResult()
    {
        // Arrange
        var clubId = 1;
        var templateData = Encoding.UTF8.GetBytes("FirstName,LastName,Email\nJohn,Doe,john@test.com");
        _mockImportService.Setup(x => x.GenerateCsvTemplateAsync(clubId))
            .ReturnsAsync(templateData);

        // Act
        var result = await _controller.DownloadTemplate(clubId);

        // Assert
        Assert.IsInstanceOf<FileContentResult>(result);
        var fileResult = result as FileContentResult;
        Assert.That(fileResult.ContentType, Is.EqualTo("text/csv"));
        Assert.That(fileResult.FileDownloadName, Is.EqualTo("member-import-template-1.csv"));
        Assert.That(fileResult.FileContents, Is.EqualTo(templateData));
    }

    [Test]
    public async Task DownloadTemplate_WhenServiceThrows_ShouldReturnInternalServerError()
    {
        // Arrange
        var clubId = 1;
        _mockImportService.Setup(x => x.GenerateCsvTemplateAsync(clubId))
            .ThrowsAsync(new Exception("Template generation failed"));

        // Act
        var result = await _controller.DownloadTemplate(clubId);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result);
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region Validate CSV Tests

    [Test]
    public async Task ValidateCsv_WithValidFile_ShouldReturnValidationResult()
    {
        // Arrange
        var clubId = 1;
        var csvContent = "FirstName,LastName,Email\nJohn,Doe,john@test.com";
        var formFile = CreateFormFile("test.csv", csvContent);

        var validationResult = new ImportValidationResult
        {
            IsValid = true,
            TotalRows = 1,
            ValidRows = 1,
            InvalidRows = 0,
            DuplicateEmails = 0,
            ValidationErrors = new List<ValidationError>(),
            Warnings = new List<ValidationWarning>()
        };

        _mockImportService.Setup(x => x.ValidateCsvAsync(clubId, formFile))
            .ReturnsAsync(validationResult);

        // Act
        var result = await _controller.ValidateCsv(clubId, formFile);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(validationResult));
    }

    [Test]
    public async Task ValidateCsv_WithNullFile_ShouldReturnBadRequest()
    {
        // Arrange
        var clubId = 1;

        // Act
        var result = await _controller.ValidateCsv(clubId, null);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result);
        var badRequestResult = result as BadRequestObjectResult;
        Assert.IsTrue(badRequestResult.Value.ToString().Contains("No file provided"));
    }

    [Test]
    public async Task ValidateCsv_WithEmptyFile_ShouldReturnBadRequest()
    {
        // Arrange
        var clubId = 1;
        var formFile = CreateFormFile("empty.csv", "");

        // Act
        var result = await _controller.ValidateCsv(clubId, formFile);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result);
        var badRequestResult = result as BadRequestObjectResult;
        Assert.IsTrue(badRequestResult.Value.ToString().Contains("No file provided or file is empty"));
    }

    [Test]
    public async Task ValidateCsv_WithLargeFile_ShouldReturnBadRequest()
    {
        // Arrange
        var clubId = 1;
        var largeContent = new string('a', 6 * 1024 * 1024); // 6MB file
        var formFile = CreateFormFile("large.csv", largeContent);

        // Act
        var result = await _controller.ValidateCsv(clubId, formFile);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result);
        var badRequestResult = result as BadRequestObjectResult;
        Assert.IsTrue(badRequestResult.Value.ToString().Contains("File size exceeds 5MB limit"));
    }

    [Test]
    public async Task ValidateCsv_WithInvalidFileExtension_ShouldReturnBadRequest()
    {
        // Arrange
        var clubId = 1;
        var formFile = CreateFormFile("test.txt", "some content");

        // Act
        var result = await _controller.ValidateCsv(clubId, formFile);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result);
        var badRequestResult = result as BadRequestObjectResult;
        Assert.IsTrue(badRequestResult.Value.ToString().Contains("File must be a CSV file"));
    }

    [Test]
    public async Task ValidateCsv_WhenServiceThrows_ShouldReturnInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var formFile = CreateFormFile("test.csv", "FirstName,LastName,Email\nJohn,Doe,john@test.com");

        _mockImportService.Setup(x => x.ValidateCsvAsync(It.IsAny<int>(), It.IsAny<IFormFile>()))
            .ThrowsAsync(new Exception("Validation failed"));

        // Act
        var result = await _controller.ValidateCsv(clubId, formFile);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result);
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region Execute Import Tests

    [Test]
    public async Task ExecuteImport_WithValidRequest_ShouldReturnImportResult()
    {
        // Arrange
        var clubId = 1;
        var importId = Guid.NewGuid();
        var request = new ImportRequest
        {
            CsvData = Convert.ToBase64String(Encoding.UTF8.GetBytes("FirstName,LastName,Email\nJohn,Doe,john@test.com")),
            Options = new ImportOptions
            {
                SkipDuplicates = false,
                SkipInvalid = false,
                NotifyMembers = false
            }
        };

        var importResult = new ImportResult
        {
            ImportId = importId,
            Status = "Completed",
            Summary = new ImportSummary
            {
                TotalProcessed = 1,
                Successful = 1,
                Failed = 0,
                Skipped = 0
            },
            Errors = new List<ImportError>()
        };

        _mockImportService.Setup(x => x.ExecuteImportAsync(clubId, 1, request))
            .ReturnsAsync(importResult);

        // Act
        var result = await _controller.ExecuteImport(clubId, request);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(importResult));
    }

    [Test]
    public async Task ExecuteImport_WithNullRequest_ShouldReturnBadRequest()
    {
        // Arrange
        var clubId = 1;

        // Act
        var result = await _controller.ExecuteImport(clubId, null);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result);
        var badRequestResult = result as BadRequestObjectResult;
        Assert.IsTrue(badRequestResult.Value.ToString().Contains("Import request is required"));
    }

    [Test]
    public async Task ExecuteImport_WithInvalidBase64_ShouldReturnBadRequest()
    {
        // Arrange
        var clubId = 1;
        var request = new ImportRequest
        {
            CsvData = "invalid-base64-data",
            Options = new ImportOptions()
        };

        _mockImportService.Setup(x => x.ExecuteImportAsync(clubId, 1, request))
            .ThrowsAsync(new FormatException("Invalid base64 string"));

        // Act
        var result = await _controller.ExecuteImport(clubId, request);

        // Assert
        Assert.IsInstanceOf<BadRequestObjectResult>(result);
        var badRequestResult = result as BadRequestObjectResult;
        Assert.IsTrue(badRequestResult.Value.ToString().Contains("Invalid CSV data format"));
    }

    [Test]
    public async Task ExecuteImport_WhenServiceThrows_ShouldReturnInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var request = new ImportRequest
        {
            CsvData = Convert.ToBase64String(Encoding.UTF8.GetBytes("FirstName,LastName,Email\nJohn,Doe,john@test.com")),
            Options = new ImportOptions()
        };

        _mockImportService.Setup(x => x.ExecuteImportAsync(clubId, 1, request))
            .ThrowsAsync(new Exception("Import execution failed"));

        // Act
        var result = await _controller.ExecuteImport(clubId, request);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result);
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region Get Import Status Tests

    [Test]
    public async Task GetImportStatus_WithValidImportId_ShouldReturnStatus()
    {
        // Arrange
        var clubId = 1;
        var importId = Guid.NewGuid();

        var importResult = new ImportResult
        {
            ImportId = importId,
            Status = "Completed",
            Summary = new ImportSummary
            {
                TotalProcessed = 1,
                Successful = 1,
                Failed = 0,
                Skipped = 0
            },
            Errors = new List<ImportError>()
        };

        _mockImportService.Setup(x => x.GetImportStatusAsync(importId))
            .ReturnsAsync(importResult);

        // Act
        var result = await _controller.GetImportStatus(clubId, importId);

        // Assert
        Assert.IsInstanceOf<OkObjectResult>(result);
        var okResult = result as OkObjectResult;
        Assert.That(okResult.Value, Is.EqualTo(importResult));
    }

    [Test]
    public async Task GetImportStatus_WithInvalidImportId_ShouldReturnNotFound()
    {
        // Arrange
        var clubId = 1;
        var importId = Guid.NewGuid();

        _mockImportService.Setup(x => x.GetImportStatusAsync(importId))
            .ReturnsAsync((ImportResult)null);

        // Act
        var result = await _controller.GetImportStatus(clubId, importId);

        // Assert
        Assert.IsInstanceOf<NotFoundObjectResult>(result);
        var notFoundResult = result as NotFoundObjectResult;
        Assert.IsTrue(notFoundResult.Value.ToString().Contains("Import operation not found"));
    }

    [Test]
    public async Task GetImportStatus_WhenServiceThrows_ShouldReturnInternalServerError()
    {
        // Arrange
        var clubId = 1;
        var importId = Guid.NewGuid();

        _mockImportService.Setup(x => x.GetImportStatusAsync(importId))
            .ThrowsAsync(new Exception("Status retrieval failed"));

        // Act
        var result = await _controller.GetImportStatus(clubId, importId);

        // Assert
        Assert.IsInstanceOf<ObjectResult>(result);
        var objectResult = result as ObjectResult;
        Assert.That(objectResult.StatusCode, Is.EqualTo(500));
    }

    #endregion

    #region Helper Methods

    private IFormFile CreateFormFile(string fileName, string content)
    {
        var bytes = Encoding.UTF8.GetBytes(content);
        var stream = new MemoryStream(bytes);
        var formFile = new Mock<IFormFile>();

        formFile.Setup(f => f.FileName).Returns(fileName);
        formFile.Setup(f => f.Length).Returns(bytes.Length);
        formFile.Setup(f => f.ContentType).Returns("text/csv");
        formFile.Setup(f => f.OpenReadStream()).Returns(stream);
        formFile.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Returns((Stream target, CancellationToken token) =>
            {
                stream.Position = 0;
                return stream.CopyToAsync(target, token);
            });

        return formFile.Object;
    }

    #endregion
}