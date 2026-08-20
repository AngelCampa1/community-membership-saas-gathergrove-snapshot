using System.Globalization;
using FluentAssertions;
using GatherGrove.API.ModelBinding;
using GatherGrove.API.Serialization;
using GatherGrove.API.Tests.Shared;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace GatherGrove.API.Tests.ModelBinding;

/// <summary>
/// Covers DateTime values arriving through query string rather than a JSON body.
///
/// This is the path the JSON converters do NOT cover: simple-type binding never
/// touches System.Text.Json, so ?startDate=2026-01-01 parses to Kind=Unspecified
/// and then throws inside Npgsql when used as a query parameter against a
/// 'timestamp with time zone' column. Six controllers bind 17 such parameters.
/// </summary>
[TestFixture]
public class UtcDateTimeModelBinderTests
{
    // ---- Behaviour: the binder actually normalizes what the framework parsed ----

    [Test]
    public async Task BindModel_DateOnlyQueryValue_ProducesUtcKind()
    {
        var result = await BindQueryValueAsync("startDate", "2026-01-01", typeof(DateTime));

        result.IsModelSet.Should().BeTrue();
        var bound = (DateTime)result.Model!;
        bound.Kind.Should().Be(DateTimeKind.Utc, "Npgsql rejects Kind=Unspecified for timestamptz parameters");
        bound.Should().Be(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
    }

    [Test]
    public async Task BindModel_OffsetBearingQueryValue_ConvertsInstantRatherThanRelabelling()
    {
        // 12:00 at +02:00 is 10:00 UTC. Relabelling instead of converting would
        // silently move the value by two hours.
        var result = await BindQueryValueAsync("startDate", "2026-01-15T12:00:00+02:00", typeof(DateTime));

        var bound = (DateTime)result.Model!;
        bound.Kind.Should().Be(DateTimeKind.Utc);
        bound.Hour.Should().Be(10);
        bound.Day.Should().Be(15);
    }

    [Test]
    public async Task BindModel_ExplicitUtcQueryValue_IsUnchanged()
    {
        var result = await BindQueryValueAsync("startDate", "2026-01-15T08:30:00Z", typeof(DateTime));

        var bound = (DateTime)result.Model!;
        bound.Kind.Should().Be(DateTimeKind.Utc);
        bound.Should().Be(new DateTime(2026, 1, 15, 8, 30, 0, DateTimeKind.Utc));
    }

    [Test]
    public async Task BindModel_NullableDateTime_ProducesUtcKind()
    {
        var result = await BindQueryValueAsync("startDate", "2026-01-01", typeof(DateTime?));

        result.IsModelSet.Should().BeTrue();
        var bound = (DateTime)result.Model!;
        bound.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Test]
    public async Task BindModel_MissingValue_LeavesModelUnsetWithoutThrowing()
    {
        var result = await BindQueryValueAsync("startDate", value: null, typeof(DateTime?));

        result.IsModelSet.Should().BeFalse();
    }

    [Test]
    public async Task BindModel_UnparseableValue_ReportsModelErrorRatherThanThrowing()
    {
        var context = CreateBindingContext("startDate", "not-a-date", typeof(DateTime));
        var binder = CreateBinder(typeof(DateTime));

        await binder.BindModelAsync(context);

        // The inner SimpleTypeModelBinder owns parse failures; wrapping it must not
        // convert a 400-with-model-error into an unhandled 500.
        context.ModelState.IsValid.Should().BeFalse();
    }

    // ---- Wiring: these fail if the registration is removed from Program.cs ----

    [Test]
    public void Application_RegistersUtcDateTimeModelBinderProvider_AheadOfSimpleTypeBinder()
    {
        using var factory = new TestWebApplicationFactory<Program>();
        var options = factory.Services.GetRequiredService<IOptions<MvcOptions>>().Value;

        var index = options.ModelBinderProviders.ToList()
            .FindIndex(p => p is UtcDateTimeModelBinderProvider);

        index.Should().BeGreaterThanOrEqualTo(0,
            "query-bound DateTimes are unprotected without this provider");

        var simpleTypeIndex = options.ModelBinderProviders.ToList()
            .FindIndex(p => p is SimpleTypeModelBinderProvider);

        index.Should().BeLessThan(simpleTypeIndex,
            "SimpleTypeModelBinderProvider claims DateTime first if it runs earlier");
    }

    [Test]
    public void Application_RegistersUtcDateTimeJsonConverters()
    {
        using var factory = new TestWebApplicationFactory<Program>();
        var jsonOptions = factory.Services
            .GetRequiredService<IOptions<Microsoft.AspNetCore.Mvc.JsonOptions>>().Value;

        jsonOptions.JsonSerializerOptions.Converters
            .Should().Contain(c => c is UtcDateTimeConverter,
                "request bodies are unprotected without this converter");
        jsonOptions.JsonSerializerOptions.Converters
            .Should().Contain(c => c is NullableUtcDateTimeConverter);
    }

    // ---- helpers ----

    private static async Task<ModelBindingResult> BindQueryValueAsync(string name, string? value, Type modelType)
    {
        var context = CreateBindingContext(name, value, modelType);
        var binder = CreateBinder(modelType);
        await binder.BindModelAsync(context);
        return context.Result;
    }

    private static IModelBinder CreateBinder(Type modelType)
        => new UtcDateTimeModelBinder(new SimpleTypeModelBinder(modelType, NullLoggerFactory.Instance));

    private static DefaultModelBindingContext CreateBindingContext(string name, string? value, Type modelType)
    {
        var metadataProvider = new EmptyModelMetadataProvider();
        var query = new Dictionary<string, Microsoft.Extensions.Primitives.StringValues>();
        if (value is not null)
        {
            query[name] = value;
        }

        return new DefaultModelBindingContext
        {
            ModelMetadata = metadataProvider.GetMetadataForType(modelType),
            ModelName = name,
            ModelState = new ModelStateDictionary(),
            ValueProvider = new QueryStringValueProvider(
                BindingSource.Query,
                new QueryCollection(query),
                CultureInfo.InvariantCulture),
            ActionContext = new ActionContext { HttpContext = new DefaultHttpContext() }
        };
    }
}
