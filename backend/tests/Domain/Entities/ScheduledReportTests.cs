using NUnit.Framework;
using GatherGrove.Domain.Entities;
using GatherGrove.Domain.Enums;

namespace Domain.Tests.Entities;

[TestFixture]
public class ScheduledReportTests
{
    #region Default Value Tests (4 tests)

    [Test]
    public void Id_DefaultsToGuid()
    {
        var report = new ScheduledReport();
        Assert.That(report.Id, Is.Not.Null);
        Assert.That(report.Id, Is.Not.EqualTo(string.Empty));
        Assert.That(Guid.Parse(report.Id), Is.Not.EqualTo(Guid.Empty));
    }

    [Test]
    public void ReportName_DefaultsToEmptyString()
    {
        var report = new ScheduledReport();
        Assert.That(report.ReportName, Is.EqualTo(string.Empty));
    }

    [Test]
    public void ReportType_DefaultsToEmptyString()
    {
        var report = new ScheduledReport();
        Assert.That(report.ReportType, Is.EqualTo(string.Empty));
    }

    [Test]
    public void IsActive_DefaultsToTrue()
    {
        var report = new ScheduledReport();
        Assert.That(report.IsActive, Is.True);
    }

    #endregion

    #region Report Type Tests (4 tests)

    [Test]
    public void ReportType_CanBeMemberReport()
    {
        var report = new ScheduledReport { ReportType = "Members" };
        Assert.That(report.ReportType, Is.EqualTo("Members"));
    }

    [Test]
    public void ReportType_CanBeFinancialReport()
    {
        var report = new ScheduledReport { ReportType = "Financial" };
        Assert.That(report.ReportType, Is.EqualTo("Financial"));
    }

    [Test]
    public void ReportType_CanBeAnalyticsReport()
    {
        var report = new ScheduledReport { ReportType = "Analytics" };
        Assert.That(report.ReportType, Is.EqualTo("Analytics"));
    }

    [Test]
    public void ReportType_CanBeEventReport()
    {
        var report = new ScheduledReport { ReportType = "Events" };
        Assert.That(report.ReportType, Is.EqualTo("Events"));
    }

    #endregion

    #region Format Tests (4 tests)

    [Test]
    public void Format_CanBeCsv()
    {
        var report = new ScheduledReport { Format = ExportFormat.Csv };
        Assert.That(report.Format, Is.EqualTo(ExportFormat.Csv));
    }

    [Test]
    public void Format_CanBeExcel()
    {
        var report = new ScheduledReport { Format = ExportFormat.Excel };
        Assert.That(report.Format, Is.EqualTo(ExportFormat.Excel));
    }

    [Test]
    public void Format_CanBePdf()
    {
        var report = new ScheduledReport { Format = ExportFormat.Pdf };
        Assert.That(report.Format, Is.EqualTo(ExportFormat.Pdf));
    }

    [Test]
    public void Format_CanBeJson()
    {
        var report = new ScheduledReport { Format = ExportFormat.Json };
        Assert.That(report.Format, Is.EqualTo(ExportFormat.Json));
    }

    #endregion

    #region Frequency Tests (5 tests)

    [Test]
    public void Frequency_CanBeDaily()
    {
        var report = new ScheduledReport { Frequency = ReportFrequency.Daily };
        Assert.That(report.Frequency, Is.EqualTo(ReportFrequency.Daily));
    }

    [Test]
    public void Frequency_CanBeWeekly()
    {
        var report = new ScheduledReport { Frequency = ReportFrequency.Weekly };
        Assert.That(report.Frequency, Is.EqualTo(ReportFrequency.Weekly));
    }

    [Test]
    public void Frequency_CanBeMonthly()
    {
        var report = new ScheduledReport { Frequency = ReportFrequency.Monthly };
        Assert.That(report.Frequency, Is.EqualTo(ReportFrequency.Monthly));
    }

    [Test]
    public void WeeklyReport_HasDayOfWeek()
    {
        var report = new ScheduledReport
        {
            Frequency = ReportFrequency.Weekly,
            WeeklyDayOfWeek = DayOfWeek.Monday
        };
        Assert.That(report.WeeklyDayOfWeek, Is.EqualTo(DayOfWeek.Monday));
    }

    [Test]
    public void MonthlyReport_HasDayOfMonth()
    {
        var report = new ScheduledReport
        {
            Frequency = ReportFrequency.Monthly,
            MonthlyDayOfMonth = 1
        };
        Assert.That(report.MonthlyDayOfMonth, Is.EqualTo(1));
    }

    #endregion

    #region Delivery Configuration Tests (5 tests)

    [Test]
    public void DeliveryTime_CanBeSet()
    {
        var deliveryTime = new TimeSpan(9, 0, 0); // 9 AM
        var report = new ScheduledReport { DeliveryTime = deliveryTime };
        Assert.That(report.DeliveryTime, Is.EqualTo(deliveryTime));
    }

    [Test]
    public void Recipients_CanBeEmpty()
    {
        var report = new ScheduledReport();
        Assert.That(report.Recipients, Is.Not.Null);
        Assert.That(report.Recipients.Count, Is.EqualTo(0));
    }

    [Test]
    public void Recipients_CanHaveMultipleEmails()
    {
        var report = new ScheduledReport
        {
            Recipients = new List<string> { "admin@example.com", "manager@example.com", "owner@example.com" }
        };
        Assert.That(report.Recipients.Count, Is.EqualTo(3));
        Assert.That(report.Recipients, Contains.Item("admin@example.com"));
    }

    [Test]
    public void NextRunDate_CanBeSet()
    {
        var nextRun = DateTime.UtcNow.AddDays(1);
        var report = new ScheduledReport { NextRunDate = nextRun };
        Assert.That(report.NextRunDate, Is.EqualTo(nextRun));
    }

    [Test]
    public void LastExecuted_CanBeNull()
    {
        var report = new ScheduledReport { LastExecuted = null };
        Assert.That(report.LastExecuted, Is.Null);
    }

    #endregion

    #region Custom Configuration Tests (3 tests)

    [Test]
    public void CustomFilters_CanBeNull()
    {
        var report = new ScheduledReport { CustomFilters = null };
        Assert.That(report.CustomFilters, Is.Null);
    }

    [Test]
    public void CustomFilters_CanStoreDictionary()
    {
        var report = new ScheduledReport
        {
            CustomFilters = new Dictionary<string, object>
            {
                { "startDate", "2025-01-01" },
                { "status", "Active" }
            }
        };
        Assert.That(report.CustomFilters, Contains.Key("startDate"));
        Assert.That(report.CustomFilters, Contains.Key("status"));
    }

    [Test]
    public void IncludeCharts_DefaultsToFalse()
    {
        var report = new ScheduledReport();
        Assert.That(report.IncludeCharts, Is.False);
    }

    #endregion

    #region Complete Report Scenarios Tests (5 tests)

    [Test]
    public void DailyMemberReport_DeliversEveryMorning()
    {
        var report = new ScheduledReport
        {
            ClubId = 5,
            ReportName = "Daily Member Summary",
            ReportType = "Members",
            Format = ExportFormat.Csv,
            Frequency = ReportFrequency.Daily,
            DeliveryTime = new TimeSpan(8, 0, 0),
            Recipients = new List<string> { "admin@club.com" },
            IsActive = true,
            NextRunDate = DateTime.UtcNow.AddDays(1)
        };

        Assert.That(report.Frequency, Is.EqualTo(ReportFrequency.Daily));
        Assert.That(report.DeliveryTime.Hours, Is.EqualTo(8));
        Assert.That(report.IsActive, Is.True);
    }

    [Test]
    public void WeeklyFinancialReport_OnMondays()
    {
        var report = new ScheduledReport
        {
            ReportName = "Weekly Revenue Report",
            ReportType = "Financial",
            Format = ExportFormat.Excel,
            Frequency = ReportFrequency.Weekly,
            WeeklyDayOfWeek = DayOfWeek.Monday,
            DeliveryTime = new TimeSpan(9, 0, 0),
            IncludeCharts = true,
            Recipients = new List<string> { "finance@club.com", "owner@club.com" }
        };

        Assert.That(report.Frequency, Is.EqualTo(ReportFrequency.Weekly));
        Assert.That(report.WeeklyDayOfWeek, Is.EqualTo(DayOfWeek.Monday));
        Assert.That(report.IncludeCharts, Is.True);
    }

    [Test]
    public void MonthlyAnalyticsReport_FirstOfMonth()
    {
        var report = new ScheduledReport
        {
            ReportName = "Monthly Analytics Report",
            ReportType = "Analytics",
            Format = ExportFormat.Pdf,
            Frequency = ReportFrequency.Monthly,
            MonthlyDayOfMonth = 1,
            DeliveryTime = new TimeSpan(6, 0, 0),
            CustomFilters = new Dictionary<string, object>
            {
                { "includeComparisons", true },
                { "period", "last30days" }
            },
            IsActive = true
        };

        Assert.That(report.Frequency, Is.EqualTo(ReportFrequency.Monthly));
        Assert.That(report.MonthlyDayOfMonth, Is.EqualTo(1));
        Assert.That(report.CustomFilters, Is.Not.Null);
    }

    [Test]
    public void InactiveReport_NotScheduled()
    {
        var report = new ScheduledReport
        {
            ReportName = "Deprecated Report",
            ReportType = "Events",
            Format = ExportFormat.Csv,
            Frequency = ReportFrequency.Weekly,
            IsActive = false,
            LastExecuted = DateTime.UtcNow.AddMonths(-6)
        };

        Assert.That(report.IsActive, Is.False);
        Assert.That(report.LastExecuted, Is.Not.Null);
    }

    [Test]
    public void CustomFilteredReport_TargetsSpecificData()
    {
        var report = new ScheduledReport
        {
            ReportName = "Active Members Report",
            ReportType = "Members",
            Format = ExportFormat.Excel,
            Frequency = ReportFrequency.Weekly,
            CustomFilters = new Dictionary<string, object>
            {
                { "status", "Active" },
                { "joinedAfter", "2024-01-01" },
                { "hasActiveMembership", true }
            },
            Recipients = new List<string> { "membership@club.com" }
        };

        Assert.That(report.CustomFilters.Count, Is.EqualTo(3));
        Assert.That(report.CustomFilters, Contains.Key("status"));
    }

    #endregion
}
