using GatherGrove.Application.Common;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;

namespace GatherGrove.API.ModelBinding;

/// <summary>
/// Normalizes DateTime values arriving through query string, route, header, or
/// form binding to <see cref="DateTimeKind.Utc"/>.
///
/// The JSON converters only cover request bodies. Simple-type binding never
/// touches System.Text.Json, so a value like ?startDate=2026-01-01 parses to
/// Kind=Unspecified and then throws inside Npgsql the moment it is used as a
/// query parameter against a 'timestamp with time zone' column.
/// </summary>
public sealed class UtcDateTimeModelBinder : IModelBinder
{
    private readonly IModelBinder _inner;

    public UtcDateTimeModelBinder(IModelBinder inner)
    {
        _inner = inner ?? throw new ArgumentNullException(nameof(inner));
    }

    public async Task BindModelAsync(ModelBindingContext bindingContext)
    {
        ArgumentNullException.ThrowIfNull(bindingContext);

        // Let the built-in binder do the parsing and error reporting, then only
        // adjust the Kind of whatever it produced.
        await _inner.BindModelAsync(bindingContext);

        if (bindingContext.Result.IsModelSet && bindingContext.Result.Model is DateTime parsed)
        {
            bindingContext.Result = ModelBindingResult.Success(UtcDateTime.Normalize(parsed));
        }
    }
}

/// <summary>
/// Supplies <see cref="UtcDateTimeModelBinder"/> for DateTime and DateTime?.
/// Must be inserted ahead of the framework's SimpleTypeModelBinderProvider,
/// which would otherwise claim these types first.
/// </summary>
public sealed class UtcDateTimeModelBinderProvider : IModelBinderProvider
{
    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        var modelType = context.Metadata.UnderlyingOrModelType;
        if (modelType != typeof(DateTime))
        {
            return null;
        }

        var loggerFactory = (ILoggerFactory)context.Services.GetRequiredService(typeof(ILoggerFactory));
        return new UtcDateTimeModelBinder(new SimpleTypeModelBinder(context.Metadata.ModelType, loggerFactory));
    }
}
