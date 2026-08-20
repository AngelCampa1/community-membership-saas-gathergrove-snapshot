using System.Net;
using System.Text.Json;
using GatherGrove.Application.Configuration;
using GatherGrove.Application.DTOs;
using GatherGrove.Application.Services;
using GatherGrove.Domain.Entities;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NUnit.Framework;

namespace GatherGrove.Application.Tests.Services;

[TestFixture]
public class SequencerServiceTests
{
    [Test]
    public async Task EnrollMarketingLeadAsync_PostsCurrentSequencerPayload()
    {
        var handler = new CapturingHandler();
        var client = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://sequencer.test")
        };
        var service = new SequencerService(
            client,
            Options.Create(new SequencerSettings
            {
                ClientId = "client-id",
                ClientSecret = "client-secret",
                MarketingNurtureSequenceSlug = "gathergrove-nurture-value-1"
            }),
            NullLogger<SequencerService>.Instance);

        await service.EnrollMarketingLeadAsync(
            new MarketingLead
            {
                Id = 42,
                Email = "lead@gathergrove.com",
                Name = "Lead Name",
                Source = "newsletter",
                Variant = "footer"
            },
            new CaptureLeadRequest { Source = "newsletter" });

        Assert.That(handler.Request, Is.Not.Null);
        Assert.That(handler.Request!.RequestUri!.PathAndQuery, Is.EqualTo("/api/v1/enrollments"));
        var json = handler.Body;
        using var body = JsonDocument.Parse(json);
        var root = body.RootElement;

        Assert.That(root.GetProperty("email").GetString(), Is.EqualTo("lead@gathergrove.com"));
        Assert.That(root.GetProperty("product").GetString(), Is.EqualTo("gathergrove"));
        Assert.That(
            root.GetProperty("sequence_slug").GetString(),
            Is.EqualTo("gathergrove-nurture-value-1"));
        Assert.That(root.GetProperty("source").GetString(), Is.EqualTo("marketing:newsletter"));
        Assert.That(root.TryGetProperty("sequenceSlug", out _), Is.False);
        Assert.That(root.TryGetProperty("productId", out _), Is.False);
    }

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }
        public string Body { get; private set; } = string.Empty;

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Request = request;
            Body = request.Content is null
                ? string.Empty
                : await request.Content.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK);
        }
    }
}
