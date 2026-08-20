namespace GatherGrove.Application.Services.Interfaces;

public interface IFileTypeDetector
{
    FileTypeResult DetectFileType(byte[] fileData);
    bool IsValidFileType(byte[] fileData, string expectedExtension);
    string GetMimeType(string fileExtension);
}