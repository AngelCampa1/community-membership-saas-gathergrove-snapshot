using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using FluentAssertions;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for PdfGenerationService (QuestPDF-based PDF generation).
/// Tests verify that PDFs are generated correctly from markdown content.
/// </summary>
[TestFixture]
public class PdfGenerationServiceTests
{
    private Mock<ILogger<PdfGenerationService>> _mockLogger = null!;
    private PdfGenerationService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<PdfGenerationService>>();
        _service = new PdfGenerationService(_mockLogger.Object);
    }

    #region GenerateClubManagementChecklistPdfAsync Tests

    [Test]
    public async Task GenerateClubManagementChecklistPdfAsync_ReturnsNonEmptyPdf()
    {
        // Act
        var result = await _service.GenerateClubManagementChecklistPdfAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
    }

    [Test]
    public async Task GenerateClubManagementChecklistPdfAsync_ReturnsValidPdfBytes()
    {
        // Act
        var result = await _service.GenerateClubManagementChecklistPdfAsync();

        // Assert - PDF files start with %PDF signature
        result.Length.Should().BeGreaterThan(4);
        // Check PDF magic number: %PDF (0x25 0x50 0x44 0x46)
        result[0].Should().Be(0x25); // %
        result[1].Should().Be(0x50); // P
        result[2].Should().Be(0x44); // D
        result[3].Should().Be(0x46); // F
    }

    [Test]
    public async Task GenerateClubManagementChecklistPdfAsync_GeneratesReasonableSizedPdf()
    {
        // Act
        var result = await _service.GenerateClubManagementChecklistPdfAsync();

        // Assert - PDF should be between 10KB and 1MB (reasonable for a checklist)
        result.Length.Should().BeGreaterThan(10 * 1024, "PDF should be at least 10KB");
        result.Length.Should().BeLessThan(1024 * 1024, "PDF should be less than 1MB");
    }

    [Test]
    public async Task GenerateClubManagementChecklistPdfAsync_MultipleCallsProduceSameResult()
    {
        // Act
        var result1 = await _service.GenerateClubManagementChecklistPdfAsync();
        var result2 = await _service.GenerateClubManagementChecklistPdfAsync();

        // Assert - The content should be identical (except possibly timestamps)
        // Since timestamps are included, check that sizes are similar
        Math.Abs(result1.Length - result2.Length).Should().BeLessThan(100,
            "Multiple generations should produce similar sized PDFs");
    }

    #endregion

    #region GenerateMarkdownToPdfAsync Tests

    [Test]
    public async Task GenerateMarkdownToPdfAsync_SimpleText_ReturnsValidPdf()
    {
        // Arrange
        var title = "Test Document";
        var content = "This is a simple test paragraph.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_WithHeaders_ReturnsValidPdf()
    {
        // Arrange
        var title = "Headers Test";
        var content = @"# Main Header
## Secondary Header
### Tertiary Header
Regular paragraph text.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_WithBulletPoints_ReturnsValidPdf()
    {
        // Arrange
        var title = "Bullet Points Test";
        var content = @"## List of Items
- First item
- Second item
- Third item
- Fourth item";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_WithCheckboxes_ReturnsValidPdf()
    {
        // Arrange
        var title = "Checkbox Test";
        var content = @"## Checklist
- [ ] Unchecked item
- [ ] Another unchecked item
- ✅ Checked item
- ✅ Another checked item";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_WithBoldText_ReturnsValidPdf()
    {
        // Arrange
        var title = "Bold Text Test";
        var content = @"This is **bold text** in a sentence.
And here is **another bold** phrase.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_WithHorizontalRule_ReturnsValidPdf()
    {
        // Arrange
        var title = "Horizontal Rule Test";
        var content = @"Section 1 content.
---
Section 2 content.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_EmptyContent_ReturnsValidPdf()
    {
        // Arrange
        var title = "Empty Content";
        var content = "";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert - Should still generate a valid PDF with just the title
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_WhitespaceOnlyContent_ReturnsValidPdf()
    {
        // Arrange
        var title = "Whitespace Content";
        var content = "   \n   \n   ";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_MixedContent_ReturnsValidPdf()
    {
        // Arrange
        var title = "Mixed Content Document";
        var content = @"# Introduction

This is an **important** document with various elements.

## Checklist Items
- [ ] First task
- [ ] Second task
- ✅ Completed task

## Bullet Points
- Regular bullet point
- Another bullet point

---

**Conclusion**: This document demonstrates all markdown features.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
        ValidatePdfMagicNumber(result);
        result.Length.Should().BeGreaterThan(5000, "Mixed content PDF should be substantial");
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_VeryLongContent_ReturnsValidPdf()
    {
        // Arrange
        var title = "Long Content";
        var contentBuilder = new System.Text.StringBuilder();
        for (int i = 0; i < 100; i++)
        {
            contentBuilder.AppendLine($"## Section {i}");
            contentBuilder.AppendLine($"This is paragraph {i} with some content.");
            contentBuilder.AppendLine($"- Bullet point {i}a");
            contentBuilder.AppendLine($"- Bullet point {i}b");
            contentBuilder.AppendLine();
        }

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, contentBuilder.ToString());

        // Assert
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_UnicodeCharacters_ReturnsValidPdf()
    {
        // Arrange
        var title = "Unicode Test 你好";
        var content = @"## International Characters
- Japanese: こんにちは
- Chinese: 你好
- Arabic: مرحبا
- Hebrew: שלום
- Emoji: 🎉🚀💻";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_SpecialCharacters_ReturnsValidPdf()
    {
        // Arrange
        var title = "Special Characters <>&\"'";
        var content = @"## Special Characters Test
- Less than: <
- Greater than: >
- Ampersand: &
- Quotes: ""test""
- Backslash: \path\to\file";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_MultipleBoldInOneLine_ReturnsValidPdf()
    {
        // Arrange
        var title = "Multiple Bold Test";
        var content = @"This has **first bold** and **second bold** and **third bold** text.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_NestedHeaders_ReturnsValidPdf()
    {
        // Arrange
        var title = "Nested Headers";
        var content = @"# Level 1
Content under level 1.
## Level 2
Content under level 2.
### Level 3
Content under level 3.
## Back to Level 2
More level 2 content.
# Another Level 1
Final content.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    #endregion

    #region Title Variations Tests

    [Test]
    public async Task GenerateMarkdownToPdfAsync_LongTitle_ReturnsValidPdf()
    {
        // Arrange
        var title = new string('A', 200); // Very long title
        var content = "Simple content.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_EmptyTitle_ReturnsValidPdf()
    {
        // Arrange
        var title = "";
        var content = "Content without a title.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_TitleWithNewlines_HandlesGracefully()
    {
        // Arrange
        var title = "Title\nWith\nNewlines";
        var content = "Content.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync(title, content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    #endregion

    #region Edge Cases and Parsing Tests

    [Test]
    public async Task GenerateMarkdownToPdfAsync_OnlyHeaders_ReturnsValidPdf()
    {
        // Arrange
        var content = @"# Header 1
## Header 2
### Header 3
# Another Header 1";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync("Headers Only", content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_OnlyBullets_ReturnsValidPdf()
    {
        // Arrange
        var content = @"- Item 1
- Item 2
- Item 3
- Item 4
- Item 5";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync("Bullets Only", content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_OnlyCheckboxes_ReturnsValidPdf()
    {
        // Arrange
        var content = @"- [ ] Task 1
- [ ] Task 2
- ✅ Task 3
- ✅ Task 4";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync("Checkboxes Only", content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_MultipleHorizontalRules_ReturnsValidPdf()
    {
        // Arrange
        var content = @"Section 1
---
Section 2
---
Section 3
---
Section 4";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync("Multiple Rules", content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_MalformedBold_HandlesGracefully()
    {
        // Arrange - Bold without closing
        var content = @"This has **unclosed bold text
And more text here.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync("Malformed Bold", content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_EmptyBold_HandlesGracefully()
    {
        // Arrange - Empty bold markers
        var content = @"This has **** empty bold.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync("Empty Bold", content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_ConsecutiveNewlines_HandlesGracefully()
    {
        // Arrange
        var content = "Line 1\n\n\n\n\nLine 2";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync("Newlines Test", content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_TabCharacters_HandlesGracefully()
    {
        // Arrange
        var content = "Content\twith\ttabs\there.";

        // Act
        var result = await _service.GenerateMarkdownToPdfAsync("Tabs Test", content);

        // Assert
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    #endregion

    #region GenerateTemplatePdfAsync Tests

    [Test]
    public async Task GenerateTemplatePdfAsync_WelcomeEmailSlug_ReturnsValidPdf()
    {
        var result = await _service.GenerateTemplatePdfAsync("welcome-email-new-members");
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateTemplatePdfAsync_EventPlanningSlug_ReturnsValidPdf()
    {
        var result = await _service.GenerateTemplatePdfAsync("master-event-planning-checklist");
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateTemplatePdfAsync_AnnualBudgetSlug_ReturnsValidPdf()
    {
        var result = await _service.GenerateTemplatePdfAsync("annual-budget-planning-template");
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateTemplatePdfAsync_MemberOnboardingSlug_ReturnsValidPdf()
    {
        var result = await _service.GenerateTemplatePdfAsync("member-onboarding-checklist");
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateTemplatePdfAsync_ClubBylawsSlug_ReturnsValidPdf()
    {
        var result = await _service.GenerateTemplatePdfAsync("club-bylaws-template");
        result.Should().NotBeNull();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateTemplatePdfAsync_UnknownSlug_ReturnsPlaceholderPdf()
    {
        // Unknown slugs should fall through to the placeholder rather than throwing
        var result = await _service.GenerateTemplatePdfAsync("some-unknown-template");
        result.Should().NotBeNull();
        result.Should().NotBeEmpty();
        ValidatePdfMagicNumber(result);
    }

    [Test]
    public async Task GenerateTemplatePdfAsync_AllKnownSlugs_AllReturnValidPdfs()
    {
        var slugs = new[]
        {
            "welcome-email-new-members",
            "master-event-planning-checklist",
            "annual-budget-planning-template",
            "member-onboarding-checklist",
            "club-bylaws-template"
        };

        foreach (var slug in slugs)
        {
            var result = await _service.GenerateTemplatePdfAsync(slug);
            result.Should().NotBeNull($"slug '{slug}' should produce a PDF");
            ValidatePdfMagicNumber(result);
        }
    }

    [Test]
    public async Task GenerateTemplatePdfAsync_KnownSlug_ProducesSubstantialPdf()
    {
        var result = await _service.GenerateTemplatePdfAsync("master-event-planning-checklist");
        result.Length.Should().BeGreaterThan(10 * 1024, "checklist PDF should be at least 10KB");
    }

    #endregion

    #region Concurrent Generation Tests

    [Test]
    public async Task GenerateMarkdownToPdfAsync_ConcurrentGeneration_AllSucceed()
    {
        // Arrange
        var tasks = new List<Task<byte[]>>();

        // Act - Generate multiple PDFs concurrently
        for (int i = 0; i < 5; i++)
        {
            tasks.Add(_service.GenerateMarkdownToPdfAsync($"Document {i}", $"Content for document {i}"));
        }

        var results = await Task.WhenAll(tasks);

        // Assert
        results.Should().HaveCount(5);
        foreach (var result in results)
        {
            result.Should().NotBeNull();
            result.Should().NotBeEmpty();
            ValidatePdfMagicNumber(result);
        }
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_MixedConcurrentGeneration_AllSucceed()
    {
        // Arrange
        var tasks = new List<Task<byte[]>>
        {
            _service.GenerateClubManagementChecklistPdfAsync(),
            _service.GenerateMarkdownToPdfAsync("Custom 1", "Content 1"),
            _service.GenerateClubManagementChecklistPdfAsync(),
            _service.GenerateMarkdownToPdfAsync("Custom 2", "Content 2"),
            _service.GenerateMarkdownToPdfAsync("Custom 3", "Content 3")
        };

        // Act
        var results = await Task.WhenAll(tasks);

        // Assert
        results.Should().HaveCount(5);
        foreach (var result in results)
        {
            result.Should().NotBeNull();
            ValidatePdfMagicNumber(result);
        }
    }

    #endregion

    #region Performance Tests

    [Test]
    public async Task GenerateClubManagementChecklistPdfAsync_CompletesInReasonableTime()
    {
        // Act
        var sw = System.Diagnostics.Stopwatch.StartNew();
        await _service.GenerateClubManagementChecklistPdfAsync();
        sw.Stop();

        // Assert - Should complete within 15 seconds (generous for slow CI/dev machines)
        // PDF generation involves complex rendering and can vary based on system load
        sw.ElapsedMilliseconds.Should().BeLessThan(15000);
    }

    [Test]
    public async Task GenerateMarkdownToPdfAsync_SimpleContent_CompletesQuickly()
    {
        // Act
        var sw = System.Diagnostics.Stopwatch.StartNew();
        await _service.GenerateMarkdownToPdfAsync("Simple", "Simple content.");
        sw.Stop();

        // Assert - Should complete within 5 seconds (simple content, generous for slow CI)
        sw.ElapsedMilliseconds.Should().BeLessThan(5000);
    }

    #endregion

    #region Helper Methods

    private static void ValidatePdfMagicNumber(byte[] pdfBytes)
    {
        pdfBytes.Length.Should().BeGreaterThan(4, "PDF should have at least 4 bytes for magic number");
        pdfBytes[0].Should().Be(0x25, "First byte should be % (0x25)");
        pdfBytes[1].Should().Be(0x50, "Second byte should be P (0x50)");
        pdfBytes[2].Should().Be(0x44, "Third byte should be D (0x44)");
        pdfBytes[3].Should().Be(0x46, "Fourth byte should be F (0x46)");
    }

    #endregion
}
