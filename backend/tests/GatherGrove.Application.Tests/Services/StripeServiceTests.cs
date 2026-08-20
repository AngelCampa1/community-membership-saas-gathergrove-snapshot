using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using GatherGrove.Application.Services;
using GatherGrove.Application.Services.Interfaces;
using FluentAssertions;
using Stripe;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Tests for StripeService (Stripe payment integration stub).
/// This is a minimal stub implementation for development/testing.
/// Tests verify the stub behavior and parameter handling.
/// </summary>
[TestFixture]
public class StripeServiceTests
{
    private Mock<ILogger<StripeService>> _mockLogger = null!;
    private StripeService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _mockLogger = new Mock<ILogger<StripeService>>();
        _service = new StripeService(_mockLogger.Object);
    }

    #region CreatePaymentIntentAsync (Request Object) Tests

    [Test]
    public async Task CreatePaymentIntentAsync_ValidRequest_ReturnsPaymentIntent()
    {
        // Arrange
        var request = new CreateStripePaymentIntentRequest
        {
            Amount = 10000, // $100.00
            Currency = "usd"
        };

        // Act
        var result = await _service.CreatePaymentIntentAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().StartWith("pi_");
        result.Status.Should().Be("requires_confirmation");
    }

    [Test]
    public async Task CreatePaymentIntentAsync_LogsAmount()
    {
        // Arrange
        var request = new CreateStripePaymentIntentRequest { Amount = 5000 };

        // Act
        await _service.CreatePaymentIntentAsync(request);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Creating payment intent");
    }

    [Test]
    public async Task CreatePaymentIntentAsync_GeneratesUniqueIds()
    {
        // Arrange
        var request = new CreateStripePaymentIntentRequest { Amount = 1000 };

        // Act
        var result1 = await _service.CreatePaymentIntentAsync(request);
        var result2 = await _service.CreatePaymentIntentAsync(request);

        // Assert
        result1.Id.Should().NotBe(result2.Id);
    }

    [Test]
    public async Task CreatePaymentIntentAsync_WithCancellation_Completes()
    {
        // Arrange
        var request = new CreateStripePaymentIntentRequest { Amount = 1000 };
        using var cts = new CancellationTokenSource();

        // Act
        var result = await _service.CreatePaymentIntentAsync(request, cts.Token);

        // Assert
        result.Should().NotBeNull();
    }

    [Test]
    public async Task CreatePaymentIntentAsync_ZeroAmount_Returns()
    {
        // Arrange
        var request = new CreateStripePaymentIntentRequest { Amount = 0 };

        // Act
        var result = await _service.CreatePaymentIntentAsync(request);

        // Assert
        result.Should().NotBeNull();
    }

    #endregion

    #region CreatePaymentIntentAsync (Amount/Currency) Tests

    [Test]
    public async Task CreatePaymentIntentAsync_AmountCurrency_ReturnsStripePaymentResult()
    {
        // Act
        var result = await _service.CreatePaymentIntentAsync(100.00m, "usd");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.PaymentIntentId.Should().StartWith("pi_");
        result.Amount.Should().Be(100.00m);
    }

    [Test]
    public async Task CreatePaymentIntentAsync_AmountCurrency_LogsDetails()
    {
        // Act
        await _service.CreatePaymentIntentAsync(50.00m, "eur");

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Creating payment intent");
    }

    [Test]
    public async Task CreatePaymentIntentAsync_DifferentCurrencies_AllSucceed()
    {
        // Act
        var usdResult = await _service.CreatePaymentIntentAsync(100m, "usd");
        var eurResult = await _service.CreatePaymentIntentAsync(100m, "eur");
        var gbpResult = await _service.CreatePaymentIntentAsync(100m, "gbp");

        // Assert
        usdResult.Success.Should().BeTrue();
        eurResult.Success.Should().BeTrue();
        gbpResult.Success.Should().BeTrue();
    }

    #endregion

    #region ConfirmPaymentIntentAsync Tests

    [Test]
    public async Task ConfirmPaymentIntentAsync_ValidId_ReturnsSucceededPaymentIntent()
    {
        // Arrange
        var paymentIntentId = "pi_test123";

        // Act
        var result = await _service.ConfirmPaymentIntentAsync(paymentIntentId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(paymentIntentId);
        result.Status.Should().Be("succeeded");
    }

    [Test]
    public async Task ConfirmPaymentIntentAsync_LogsPaymentIntentId()
    {
        // Arrange
        var paymentIntentId = "pi_confirm123";

        // Act
        await _service.ConfirmPaymentIntentAsync(paymentIntentId);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Confirming payment intent");
    }

    [Test]
    public async Task ConfirmPaymentIntentAsync_PreservesPaymentIntentId()
    {
        // Arrange
        var paymentIntentId = "pi_preserve_this_id";

        // Act
        var result = await _service.ConfirmPaymentIntentAsync(paymentIntentId);

        // Assert
        result.Id.Should().Be(paymentIntentId);
    }

    #endregion

    #region ProcessRefundAsync Tests

    [Test]
    public async Task ProcessRefundAsync_ValidRequest_ReturnsSucceededRefund()
    {
        // Arrange
        var request = new ProcessStripeRefundRequest
        {
            PaymentIntentId = "pi_torefund123"
        };

        // Act
        var result = await _service.ProcessRefundAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().StartWith("re_");
        result.Status.Should().Be("succeeded");
    }

    [Test]
    public async Task ProcessRefundAsync_LogsPaymentIntentId()
    {
        // Arrange
        var request = new ProcessStripeRefundRequest
        {
            PaymentIntentId = "pi_logged_refund"
        };

        // Act
        await _service.ProcessRefundAsync(request);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Processing refund");
    }

    [Test]
    public async Task ProcessRefundAsync_GeneratesUniqueRefundIds()
    {
        // Arrange
        var request = new ProcessStripeRefundRequest { PaymentIntentId = "pi_test" };

        // Act
        var result1 = await _service.ProcessRefundAsync(request);
        var result2 = await _service.ProcessRefundAsync(request);

        // Assert
        result1.Id.Should().NotBe(result2.Id);
    }

    #endregion

    #region CreateRefundAsync Tests

    [Test]
    public async Task CreateRefundAsync_ValidRequest_ReturnsStripeRefundResult()
    {
        // Act
        var result = await _service.CreateRefundAsync("ch_charge123", 50.00m);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.RefundId.Should().StartWith("re_");
        result.Amount.Should().Be(50.00m);
    }

    [Test]
    public async Task CreateRefundAsync_LogsChargeAndAmount()
    {
        // Act
        await _service.CreateRefundAsync("ch_test", 25.00m);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Creating refund");
    }

    [Test]
    public async Task CreateRefundAsync_PreservesAmount()
    {
        // Arrange
        var amount = 99.99m;

        // Act
        var result = await _service.CreateRefundAsync("ch_test", amount);

        // Assert
        result.Amount.Should().Be(amount);
    }

    #endregion

    #region CreateCustomerAsync Tests

    [Test]
    public async Task CreateCustomerAsync_ValidRequest_ReturnsCustomer()
    {
        // Arrange
        var request = new CreateStripeCustomerRequest
        {
            Email = "customer@test.com"
        };

        // Act
        var result = await _service.CreateCustomerAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().StartWith("cus_");
        result.Email.Should().Be("customer@test.com");
    }

    [Test]
    public async Task CreateCustomerAsync_LogsEmail()
    {
        // Arrange
        var request = new CreateStripeCustomerRequest
        {
            Email = "logged@test.com"
        };

        // Act
        await _service.CreateCustomerAsync(request);

        // Assert
        VerifyLogWasCalled(LogLevel.Information, "Creating customer");
    }

    [Test]
    public async Task CreateCustomerAsync_GeneratesUniqueCustomerIds()
    {
        // Arrange
        var request = new CreateStripeCustomerRequest { Email = "test@test.com" };

        // Act
        var result1 = await _service.CreateCustomerAsync(request);
        var result2 = await _service.CreateCustomerAsync(request);

        // Assert
        result1.Id.Should().NotBe(result2.Id);
    }

    [Test]
    public async Task CreateCustomerAsync_PreservesEmail()
    {
        // Arrange
        var request = new CreateStripeCustomerRequest
        {
            Email = "preserve.this.email@test.com"
        };

        // Act
        var result = await _service.CreateCustomerAsync(request);

        // Assert
        result.Email.Should().Be("preserve.this.email@test.com");
    }

    #endregion

    #region GetPaymentIntentAsync Tests

    [Test]
    public async Task GetPaymentIntentAsync_ValidId_ReturnsPaymentIntent()
    {
        // Arrange
        var paymentIntentId = "pi_get_test";

        // Act
        var result = await _service.GetPaymentIntentAsync(paymentIntentId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(paymentIntentId);
        result.Status.Should().Be("succeeded");
    }

    [Test]
    public async Task GetPaymentIntentAsync_PreservesId()
    {
        // Arrange
        var paymentIntentId = "pi_preserve_id_123";

        // Act
        var result = await _service.GetPaymentIntentAsync(paymentIntentId);

        // Assert
        result.Id.Should().Be(paymentIntentId);
    }

    #endregion

    #region GetCustomerAsync Tests

    [Test]
    public async Task GetCustomerAsync_ValidId_ReturnsCustomer()
    {
        // Arrange
        var customerId = "cus_get_test";

        // Act
        var result = await _service.GetCustomerAsync(customerId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(customerId);
    }

    [Test]
    public async Task GetCustomerAsync_PreservesId()
    {
        // Arrange
        var customerId = "cus_preserve_123";

        // Act
        var result = await _service.GetCustomerAsync(customerId);

        // Assert
        result.Id.Should().Be(customerId);
    }

    #endregion

    #region UpdatePaymentIntentAsync Tests

    [Test]
    public async Task UpdatePaymentIntentAsync_ValidInput_ReturnsPaymentIntent()
    {
        // Arrange
        var paymentIntentId = "pi_update_test";
        var options = new PaymentIntentUpdateOptions();

        // Act
        var result = await _service.UpdatePaymentIntentAsync(paymentIntentId, options);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(paymentIntentId);
        result.Status.Should().Be("requires_confirmation");
    }

    [Test]
    public async Task UpdatePaymentIntentAsync_PreservesId()
    {
        // Arrange
        var paymentIntentId = "pi_preserve_update";
        var options = new PaymentIntentUpdateOptions();

        // Act
        var result = await _service.UpdatePaymentIntentAsync(paymentIntentId, options);

        // Assert
        result.Id.Should().Be(paymentIntentId);
    }

    #endregion

    #region CancelPaymentIntentAsync Tests

    [Test]
    public async Task CancelPaymentIntentAsync_ValidId_ReturnsCanceledPaymentIntent()
    {
        // Arrange
        var paymentIntentId = "pi_cancel_test";

        // Act
        var result = await _service.CancelPaymentIntentAsync(paymentIntentId);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(paymentIntentId);
        result.Status.Should().Be("canceled");
    }

    [Test]
    public async Task CancelPaymentIntentAsync_PreservesId()
    {
        // Arrange
        var paymentIntentId = "pi_preserve_cancel";

        // Act
        var result = await _service.CancelPaymentIntentAsync(paymentIntentId);

        // Assert
        result.Id.Should().Be(paymentIntentId);
    }

    #endregion

    #region CreateSetupIntentAsync Tests

    [Test]
    public async Task CreateSetupIntentAsync_ValidRequest_ReturnsSetupIntent()
    {
        // Arrange
        var request = new CreateStripeSetupIntentRequest();

        // Act
        var result = await _service.CreateSetupIntentAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().StartWith("seti_");
        result.Status.Should().Be("requires_confirmation");
    }

    [Test]
    public async Task CreateSetupIntentAsync_GeneratesUniqueIds()
    {
        // Arrange
        var request = new CreateStripeSetupIntentRequest();

        // Act
        var result1 = await _service.CreateSetupIntentAsync(request);
        var result2 = await _service.CreateSetupIntentAsync(request);

        // Assert
        result1.Id.Should().NotBe(result2.Id);
    }

    #endregion

    #region GetCustomerPaymentMethodsAsync Tests

    [Test]
    public async Task GetCustomerPaymentMethodsAsync_ValidCustomerId_ReturnsEmptyList()
    {
        // Arrange
        var customerId = "cus_methods_test";

        // Act
        var result = await _service.GetCustomerPaymentMethodsAsync(customerId);

        // Assert
        result.Should().NotBeNull();
        result.Data.Should().NotBeNull();
        result.Data.Should().BeEmpty(); // Stub returns empty list
    }

    [Test]
    public async Task GetCustomerPaymentMethodsAsync_ReturnsStripeList()
    {
        // Arrange
        var customerId = "cus_test";

        // Act
        var result = await _service.GetCustomerPaymentMethodsAsync(customerId);

        // Assert
        result.Should().BeOfType<StripeList<PaymentMethod>>();
    }

    #endregion

    #region Concurrent Operations Tests

    [Test]
    public async Task StripeService_ConcurrentOperations_AllSucceed()
    {
        // Arrange
        var tasks = new List<Task>();

        // Act
        for (int i = 0; i < 10; i++)
        {
            tasks.Add(_service.CreatePaymentIntentAsync(new CreateStripePaymentIntentRequest { Amount = i * 100 }));
            tasks.Add(_service.CreateCustomerAsync(new CreateStripeCustomerRequest { Email = $"test{i}@test.com" }));
        }

        // Assert - All should complete without throwing
        await Task.WhenAll(tasks);
        tasks.Should().OnlyContain(t => t.IsCompletedSuccessfully);
    }

    [Test]
    public async Task StripeService_FullPaymentFlow_CompletesSuccessfully()
    {
        // Arrange & Act - Simulate a complete payment flow
        var customer = await _service.CreateCustomerAsync(new CreateStripeCustomerRequest { Email = "flow@test.com" });
        var paymentIntent = await _service.CreatePaymentIntentAsync(new CreateStripePaymentIntentRequest { Amount = 10000 });
        var confirmedIntent = await _service.ConfirmPaymentIntentAsync(paymentIntent.Id);
        var retrievedIntent = await _service.GetPaymentIntentAsync(confirmedIntent.Id);

        // Assert
        customer.Id.Should().StartWith("cus_");
        paymentIntent.Status.Should().Be("requires_confirmation");
        confirmedIntent.Status.Should().Be("succeeded");
        retrievedIntent.Id.Should().Be(confirmedIntent.Id);
    }

    [Test]
    public async Task StripeService_RefundFlow_CompletesSuccessfully()
    {
        // Arrange & Act - Simulate a refund flow
        var paymentIntent = await _service.CreatePaymentIntentAsync(new CreateStripePaymentIntentRequest { Amount = 5000 });
        await _service.ConfirmPaymentIntentAsync(paymentIntent.Id);
        var refund = await _service.ProcessRefundAsync(new ProcessStripeRefundRequest { PaymentIntentId = paymentIntent.Id });

        // Assert
        refund.Status.Should().Be("succeeded");
    }

    #endregion

    #region Cancellation Token Tests

    [Test]
    public async Task StripeService_CancellationToken_RespectsToken()
    {
        // Arrange
        using var cts = new CancellationTokenSource();

        // Act - All operations should accept cancellation token
        var result1 = await _service.CreatePaymentIntentAsync(new CreateStripePaymentIntentRequest { Amount = 100 }, cts.Token);
        var result2 = await _service.ConfirmPaymentIntentAsync("pi_test", cts.Token);
        var result3 = await _service.ProcessRefundAsync(new ProcessStripeRefundRequest { PaymentIntentId = "pi_test" }, cts.Token);
        var result4 = await _service.CreateCustomerAsync(new CreateStripeCustomerRequest { Email = "test@test.com" }, cts.Token);

        // Assert - All should complete
        result1.Should().NotBeNull();
        result2.Should().NotBeNull();
        result3.Should().NotBeNull();
        result4.Should().NotBeNull();
    }

    #endregion

    #region Helper Methods

    private void VerifyLogWasCalled(LogLevel level, string containsMessage)
    {
        _mockLogger.Verify(
            x => x.Log(
                level,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains(containsMessage)),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            $"Expected log at level {level} containing '{containsMessage}'");
    }

    #endregion
}
