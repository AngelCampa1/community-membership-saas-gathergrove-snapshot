using GatherGrove.Domain.Entities;
using GatherGrove.Infrastructure.Repositories;
using GatherGrove.Infrastructure.Tests.TestUtilities;
using Microsoft.Extensions.Logging.Abstractions;
using NUnit.Framework;

namespace GatherGrove.Infrastructure.Tests.Repositories;

[TestFixture]
public class FinancialRepositoryTests : RepositoryTestBase
{
    private FinancialRepository _repository = null!;
    private Club _testClub = null!;
    private Member _testMember = null!;
    private MembershipType _testMembershipType = null!;

    [SetUp]
    public void SetUp()
    {
        CreateContext();
        _repository = new FinancialRepository(Context, NullLogger<FinancialRepository>.Instance);

        // Setup test data
        _testClub = new Club
        {
            Id = 1,
            Name = "Test Club",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.Clubs.Add(_testClub);

        _testMembershipType = new MembershipType
        {
            Id = 1,
            ClubId = _testClub.Id,
            Name = "Premium",
            DuesAmount = 100.00m,
            IsActive = true
        };
        Context.MembershipTypes.Add(_testMembershipType);

        _testMember = new Member
        {
            Id = 1,
            ClubId = _testClub.Id,
            FullName = "John Doe",
            Email = "john@example.com",
            MembershipTypeId = _testMembershipType.Id,
            DuesPaidUntil = DateTime.UtcNow.AddMonths(1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        Context.Members.Add(_testMember);

        Context.SaveChanges();
    }

    #region GetFinancialDataAsync Tests

    [Test]
    public async Task GetFinancialDataAsync_NoFilters_ReturnsAllPayments()
    {
        // Arrange
        var payment1 = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 100.00m,
            PaymentDate = DateTime.UtcNow.AddDays(-10),
            PaymentMethod = "CreditCard",
            CreatedAt = DateTime.UtcNow
        };
        var payment2 = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 50.00m,
            PaymentDate = DateTime.UtcNow.AddDays(-5),
            PaymentMethod = "Check",
            CreatedAt = DateTime.UtcNow
        };
        Context.Payments.AddRange(payment1, payment2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFinancialDataAsync(_testClub.Id, null, null);

        // Assert
        Assert.That(result, Has.Count.EqualTo(2));

        var firstTransaction = result[0];
        var firstType = firstTransaction.GetType();
        var amountProperty = firstType.GetProperty("Amount");
        var amount = (decimal)amountProperty!.GetValue(firstTransaction)!;
        Assert.That(amount, Is.EqualTo(50.00m)); // Most recent first
    }

    [Test]
    public async Task GetFinancialDataAsync_WithDateFilter_FiltersCorrectly()
    {
        // Arrange
        var oldPayment = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 100.00m,
            PaymentDate = DateTime.UtcNow.AddMonths(-2),
            PaymentMethod = "CreditCard",
            CreatedAt = DateTime.UtcNow
        };
        var recentPayment = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 50.00m,
            PaymentDate = DateTime.UtcNow.AddDays(-5),
            PaymentMethod = "Check",
            CreatedAt = DateTime.UtcNow
        };
        Context.Payments.AddRange(oldPayment, recentPayment);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFinancialDataAsync(
            _testClub.Id,
            DateTime.UtcNow.AddMonths(-1),
            null);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
    }

    [Test]
    public async Task GetFinancialDataAsync_NoPayments_ReturnsEmptyList()
    {
        // Act
        var result = await _repository.GetFinancialDataAsync(_testClub.Id, null, null);

        // Assert
        Assert.That(result, Is.Empty);
    }

    #endregion

    #region GetMembershipFeesAsync Tests

    [Test]
    public async Task GetMembershipFeesAsync_ReturnsFeesWithMemberInfo()
    {
        // Arrange
        var payment = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 100.00m,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "CreditCard",
            CreatedAt = DateTime.UtcNow
        };
        Context.Payments.Add(payment);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetMembershipFeesAsync(_testClub.Id, null, null);

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));

        var fee = result[0];
        var feeType = fee.GetType();

        var memberNameProperty = feeType.GetProperty("MemberName");
        var memberName = (string)memberNameProperty!.GetValue(fee)!;
        Assert.That(memberName, Is.EqualTo("John Doe"));

        var amountProperty = feeType.GetProperty("Amount");
        var amount = (decimal)amountProperty!.GetValue(fee)!;
        Assert.That(amount, Is.EqualTo(100.00m));
    }

    [Test]
    public async Task GetMembershipFeesAsync_WithDateRange_FiltersByDate()
    {
        // Arrange
        var oldPayment = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 100.00m,
            PaymentDate = DateTime.UtcNow.AddYears(-1),
            PaymentMethod = "CreditCard",
            CreatedAt = DateTime.UtcNow
        };
        var recentPayment = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 50.00m,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "Check",
            CreatedAt = DateTime.UtcNow
        };
        Context.Payments.AddRange(oldPayment, recentPayment);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetMembershipFeesAsync(
            _testClub.Id,
            DateTime.UtcNow.AddMonths(-1),
            DateTime.UtcNow.AddMonths(1));

        // Assert
        Assert.That(result, Has.Count.EqualTo(1));
    }

    #endregion

    #region GetFinancialSummaryAsync Tests

    [Test]
    public async Task GetFinancialSummaryAsync_CalculatesTotalsCorrectly()
    {
        // Arrange
        var payment1 = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 100.00m,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "CreditCard",
            CreatedAt = DateTime.UtcNow
        };
        var payment2 = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 50.00m,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "Check",
            CreatedAt = DateTime.UtcNow
        };
        Context.Payments.AddRange(payment1, payment2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFinancialSummaryAsync(_testClub.Id, null, null);

        // Assert
        var resultType = result.GetType();

        var totalRevenueProperty = resultType.GetProperty("TotalRevenue");
        var totalRevenue = (decimal)totalRevenueProperty!.GetValue(result)!;
        Assert.That(totalRevenue, Is.EqualTo(150.00m));

        var membershipFeesProperty = resultType.GetProperty("MembershipFees");
        var membershipFees = (decimal)membershipFeesProperty!.GetValue(result)!;
        Assert.That(membershipFees, Is.EqualTo(150.00m));
    }

    [Test]
    public async Task GetFinancialSummaryAsync_NoPayments_ReturnsZeros()
    {
        // Act
        var result = await _repository.GetFinancialSummaryAsync(_testClub.Id, null, null);

        // Assert
        var resultType = result.GetType();

        var totalRevenueProperty = resultType.GetProperty("TotalRevenue");
        var totalRevenue = (decimal)totalRevenueProperty!.GetValue(result)!;
        Assert.That(totalRevenue, Is.EqualTo(0m));
    }

    [Test]
    public async Task GetFinancialSummaryAsync_CalculatesNetIncome()
    {
        // Arrange
        var payment = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 200.00m,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = "CreditCard",
            CreatedAt = DateTime.UtcNow
        };
        Context.Payments.Add(payment);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFinancialSummaryAsync(_testClub.Id, null, null);

        // Assert
        var resultType = result.GetType();

        var netIncomeProperty = resultType.GetProperty("NetIncome");
        var netIncome = (decimal)netIncomeProperty!.GetValue(result)!;
        Assert.That(netIncome, Is.EqualTo(200.00m)); // Revenue - Expenses (0)
    }

    #endregion

    #region GetBudgetComparisonAsync Tests

    [Test]
    public async Task GetBudgetComparisonAsync_CalculatesActualSpending()
    {
        // Arrange
        var payment = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 500.00m,
            PaymentDate = new DateTime(2024, 6, 15),
            PaymentMethod = "CreditCard",
            CreatedAt = DateTime.UtcNow
        };
        Context.Payments.Add(payment);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetBudgetComparisonAsync(_testClub.Id, 2024);

        // Assert
        var resultType = result.GetType();

        var budgetYearProperty = resultType.GetProperty("BudgetYear");
        var budgetYear = (int)budgetYearProperty!.GetValue(result)!;
        Assert.That(budgetYear, Is.EqualTo(2024));

        var actualSpendingProperty = resultType.GetProperty("ActualSpending");
        var actualSpending = (decimal)actualSpendingProperty!.GetValue(result)!;
        Assert.That(actualSpending, Is.EqualTo(500.00m));
    }

    [Test]
    public async Task GetBudgetComparisonAsync_FiltersCorrectYear()
    {
        // Arrange
        var payment2023 = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 300.00m,
            PaymentDate = new DateTime(2023, 6, 15),
            PaymentMethod = "CreditCard",
            CreatedAt = DateTime.UtcNow
        };
        var payment2024 = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 400.00m,
            PaymentDate = new DateTime(2024, 6, 15),
            PaymentMethod = "Check",
            CreatedAt = DateTime.UtcNow
        };
        Context.Payments.AddRange(payment2023, payment2024);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetBudgetComparisonAsync(_testClub.Id, 2024);

        // Assert
        var resultType = result.GetType();

        var actualSpendingProperty = resultType.GetProperty("ActualSpending");
        var actualSpending = (decimal)actualSpendingProperty!.GetValue(result)!;
        Assert.That(actualSpending, Is.EqualTo(400.00m)); // Only 2024 payment
    }

    #endregion

    #region GetTaxDataAsync Tests

    [Test]
    public async Task GetTaxDataAsync_CalculatesTotalIncome()
    {
        // Arrange
        var payment = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 1000.00m,
            PaymentDate = new DateTime(2024, 3, 15),
            PaymentMethod = "CreditCard",
            CreatedAt = DateTime.UtcNow
        };
        Context.Payments.Add(payment);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetTaxDataAsync(_testClub.Id, 2024);

        // Assert
        var resultType = result.GetType();

        var taxYearProperty = resultType.GetProperty("TaxYear");
        var taxYear = (int)taxYearProperty!.GetValue(result)!;
        Assert.That(taxYear, Is.EqualTo(2024));

        var totalIncomeProperty = resultType.GetProperty("TotalIncome");
        var totalIncome = (decimal)totalIncomeProperty!.GetValue(result)!;
        Assert.That(totalIncome, Is.EqualTo(1000.00m));
    }

    [Test]
    public async Task GetTaxDataAsync_CalculatesTaxableIncome()
    {
        // Arrange
        var payment = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 800.00m,
            PaymentDate = new DateTime(2024, 8, 20),
            PaymentMethod = "CreditCard",
            CreatedAt = DateTime.UtcNow
        };
        Context.Payments.Add(payment);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetTaxDataAsync(_testClub.Id, 2024);

        // Assert
        var resultType = result.GetType();

        var taxableIncomeProperty = resultType.GetProperty("TaxableIncome");
        var taxableIncome = (decimal)taxableIncomeProperty!.GetValue(result)!;
        Assert.That(taxableIncome, Is.EqualTo(800.00m)); // Income - Deductible (0)
    }

    [Test]
    public async Task GetTaxDataAsync_IncludesPaymentMethodBreakdown()
    {
        // Arrange
        var payment1 = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 300.00m,
            PaymentDate = new DateTime(2024, 4, 10),
            PaymentMethod = "CreditCard",
            CreatedAt = DateTime.UtcNow
        };
        var payment2 = new Payment
        {
            ClubId = _testClub.Id,
            MemberId = _testMember.Id,
            Amount = 200.00m,
            PaymentDate = new DateTime(2024, 5, 15),
            PaymentMethod = "Check",
            CreatedAt = DateTime.UtcNow
        };
        Context.Payments.AddRange(payment1, payment2);
        await Context.SaveChangesAsync();

        // Act
        var result = await _repository.GetTaxDataAsync(_testClub.Id, 2024);

        // Assert
        var resultType = result.GetType();

        var breakdownProperty = resultType.GetProperty("PaymentMethodBreakdown");
        var breakdown = breakdownProperty!.GetValue(result) as System.Collections.IEnumerable;
        Assert.That(breakdown, Is.Not.Null);

        var breakdownList = breakdown!.Cast<object>().ToList();
        Assert.That(breakdownList, Has.Count.EqualTo(2));
    }

    #endregion
}
