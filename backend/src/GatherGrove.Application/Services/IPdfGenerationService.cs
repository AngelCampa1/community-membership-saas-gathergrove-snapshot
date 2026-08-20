namespace GatherGrove.Application.Services;

/// <summary>
/// Service for generating PDF documents
/// </summary>
public interface IPdfGenerationService
{
    /// <summary>
    /// Generate the Club Management Checklist PDF
    /// </summary>
    /// <returns>PDF content as byte array</returns>
    Task<byte[]> GenerateClubManagementChecklistPdfAsync();

    /// <summary>
    /// Generate a template PDF by slug
    /// </summary>
    /// <param name="slug">Kebab-case template identifier</param>
    /// <returns>PDF content as byte array</returns>
    Task<byte[]> GenerateTemplatePdfAsync(string slug);

    /// <summary>
    /// Generate a custom PDF from markdown content
    /// </summary>
    /// <param name="title">PDF title</param>
    /// <param name="content">Markdown content</param>
    /// <returns>PDF content as byte array</returns>
    Task<byte[]> GenerateMarkdownToPdfAsync(string title, string content);
}