using GatherGrove.Application.Security;

namespace GatherGrove.Application.Services.Interfaces;

public interface IDataSanitizationService
{
    Task<T> SanitizeAsync<T>(T data) where T : class;
    Task<T> SanitizeAsync<T>(T data, DataSanitizationRules rules) where T : class;
    Task<byte[]> SanitizeFileAsync(byte[] fileData, string fileExtension);
    bool ContainsSensitiveData(string content);
    string RemovePiiData(string content);
}