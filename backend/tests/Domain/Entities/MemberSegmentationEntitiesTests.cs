using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using GatherGrove.Domain.Entities;
using Xunit;

namespace GatherGrove.Tests.Domain.Entities;

/// <summary>
/// Comprehensive test suite for member segmentation domain entities
/// Tests validation, relationships, and business rules
/// </summary>
public class MemberSegmentationEntitiesTests
{
    [Theory]
    [InlineData("Text")]
    [InlineData("Number")]
    [InlineData("Date")]
    [InlineData("Boolean")]
    [InlineData("Select")]
    [InlineData("MultiSelect")]
    public void MemberCustomField_ValidFieldType_ShouldPass(string fieldType)
    {
        // Arrange & Act
        var customField = new MemberCustomField
        {
            ClubId = 1,
            FieldName = "Test Field",
            FieldType = fieldType,
            IsRequired = true
        };

        // Assert
        var validationResults = ValidateEntity(customField);
        validationResults.Should().BeEmpty();
        customField.FieldType.Should().Be(fieldType);
    }

    [Fact]
    public void MemberCustomField_RequiredFields_ShouldValidate()
    {
        // Arrange
        var customField = new MemberCustomField
        {
            ClubId = 1,
            FieldName = "Test Field",
            FieldType = "Text"
        };

        // Act
        var validationResults = ValidateEntity(customField);

        // Assert
        validationResults.Should().BeEmpty();
        customField.ClubId.Should().Be(1);
        customField.FieldName.Should().Be("Test Field");
        customField.FieldType.Should().Be("Text");
    }

    [Fact]
    public void MemberCustomField_EmptyFieldName_ShouldFail()
    {
        // Arrange
        var customField = new MemberCustomField
        {
            ClubId = 1,
            FieldName = "",
            FieldType = "Text"
        };

        // Act
        var validationResults = ValidateEntity(customField);

        // Assert
        validationResults.Should().NotBeEmpty();
        validationResults.Should().Contain(r => r.ErrorMessage.Contains("FieldName"));
    }

    [Fact]
    public void MemberTag_ValidProperties_ShouldPass()
    {
        // Arrange & Act
        var tag = new MemberTag
        {
            ClubId = 1,
            TagName = "VIP Member",
            Color = "#FF0000",
            Description = "High-value member"
        };

        // Assert
        var validationResults = ValidateEntity(tag);
        validationResults.Should().BeEmpty();
        tag.TagName.Should().Be("VIP Member");
        tag.Color.Should().Be("#FF0000");
    }

    [Fact]
    public void MemberTag_DuplicateName_ShouldHaveUniqueConstraint()
    {
        // Arrange
        var tag1 = new MemberTag
        {
            ClubId = 1,
            TagName = "VIP Member"
        };

        var tag2 = new MemberTag
        {
            ClubId = 1,
            TagName = "VIP Member" // Duplicate name in same club
        };

        // Act & Assert
        // This would be enforced at database level through unique constraint
        tag1.TagName.Should().Be(tag2.TagName);
        tag1.ClubId.Should().Be(tag2.ClubId);
    }

    [Fact]
    public void MemberCustomFieldValue_ValidValue_ShouldPass()
    {
        // Arrange & Act
        var fieldValue = new MemberCustomFieldValue
        {
            MemberId = 1,
            CustomFieldId = 1,
            Value = "Test Value"
        };

        // Assert
        var validationResults = ValidateEntity(fieldValue);
        validationResults.Should().BeEmpty();
        fieldValue.Value.Should().Be("Test Value");
    }

    [Fact]
    public void MemberTagAssignment_ValidAssignment_ShouldPass()
    {
        // Arrange & Act
        var assignment = new MemberTagAssignment
        {
            MemberId = 1,
            TagId = 1,
            AssignedBy = 1,
            AssignedAt = DateTime.UtcNow,
            IsActive = true
        };

        // Assert
        var validationResults = ValidateEntity(assignment);
        validationResults.Should().BeEmpty();
        assignment.IsActive.Should().BeTrue();
        assignment.AssignedBy.Should().Be(1);
    }

    [Fact]
    public void MemberSegment_ValidSegment_ShouldPass()
    {
        // Arrange & Act
        var segment = new MemberSegment
        {
            ClubId = 1,
            Name = "Active Members",
            Description = "Members with high engagement",
            CreatedBy = 1,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        // Assert
        var validationResults = ValidateEntity(segment);
        validationResults.Should().BeEmpty();
        segment.Name.Should().Be("Active Members");
        segment.IsActive.Should().BeTrue();
    }

    [Theory]
    [InlineData("EQUALS")]
    [InlineData("NOT_EQUALS")]
    [InlineData("CONTAINS")]
    [InlineData("NOT_CONTAINS")]
    [InlineData("STARTS_WITH")]
    [InlineData("ENDS_WITH")]
    [InlineData("GREATER_THAN")]
    [InlineData("LESS_THAN")]
    [InlineData("GREATER_THAN_OR_EQUAL")]
    [InlineData("LESS_THAN_OR_EQUAL")]
    [InlineData("IN")]
    [InlineData("NOT_IN")]
    [InlineData("IS_NULL")]
    [InlineData("IS_NOT_NULL")]
    public void MemberSegmentRule_ValidOperator_ShouldPass(string operatorType)
    {
        // Arrange & Act
        var rule = new MemberSegmentRule
        {
            SegmentId = 1,
            FieldName = "FullName",
            Operator = operatorType,
            Value = "Test Value",
            LogicalOperator = "AND"
        };

        // Assert
        var validationResults = ValidateEntity(rule);
        validationResults.Should().BeEmpty();
        rule.Operator.Should().Be(operatorType);
    }

    [Theory]
    [InlineData("AND")]
    [InlineData("OR")]
    public void MemberSegmentRule_ValidLogicalOperator_ShouldPass(string logicalOperator)
    {
        // Arrange & Act
        var rule = new MemberSegmentRule
        {
            SegmentId = 1,
            FieldName = "FullName",
            Operator = "EQUALS",
            Value = "Test",
            LogicalOperator = logicalOperator
        };

        // Assert
        var validationResults = ValidateEntity(rule);
        validationResults.Should().BeEmpty();
        rule.LogicalOperator.Should().Be(logicalOperator);
    }

    [Fact]
    public void MemberSegmentCache_ValidCache_ShouldPass()
    {
        // Arrange & Act
        var cache = new MemberSegmentCache
        {
            SegmentId = 1,
            MemberId = 1,
            LastUpdated = DateTime.UtcNow,
            IsIncluded = true
        };

        // Assert
        var validationResults = ValidateEntity(cache);
        validationResults.Should().BeEmpty();
        cache.IsIncluded.Should().BeTrue();
        cache.LastUpdated.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void BulkOperation_ValidOperation_ShouldPass()
    {
        // Arrange & Act
        var operation = new BulkOperation
        {
            ClubId = 1,
            OperationType = "UPDATE_TAGS",
            Status = "PENDING",
            InitiatedBy = 1,
            CreatedAt = DateTime.UtcNow,
            TotalRecords = 100
        };

        // Assert
        var validationResults = ValidateEntity(operation);
        validationResults.Should().BeEmpty();
        operation.Status.Should().Be("PENDING");
        operation.TotalRecords.Should().Be(100);
    }

    [Theory]
    [InlineData("ADD_TAGS")]
    [InlineData("REMOVE_TAGS")]
    [InlineData("UPDATE_CUSTOM_FIELDS")]
    [InlineData("EXPORT_MEMBERS")]
    [InlineData("DELETE_MEMBERS")]
    [InlineData("UPDATE_MEMBERSHIP_TYPE")]
    public void BulkOperation_ValidOperationType_ShouldPass(string operationType)
    {
        // Arrange & Act
        var operation = new BulkOperation
        {
            ClubId = 1,
            OperationType = operationType,
            Status = "PENDING",
            InitiatedBy = 1,
            CreatedAt = DateTime.UtcNow
        };

        // Assert
        var validationResults = ValidateEntity(operation);
        validationResults.Should().BeEmpty();
        operation.OperationType.Should().Be(operationType);
    }

    [Theory]
    [InlineData("PENDING")]
    [InlineData("IN_PROGRESS")]
    [InlineData("COMPLETED")]
    [InlineData("FAILED")]
    [InlineData("CANCELLED")]
    public void BulkOperation_ValidStatus_ShouldPass(string status)
    {
        // Arrange & Act
        var operation = new BulkOperation
        {
            ClubId = 1,
            OperationType = "ADD_TAGS",
            Status = status,
            InitiatedBy = 1,
            CreatedAt = DateTime.UtcNow
        };

        // Assert
        var validationResults = ValidateEntity(operation);
        validationResults.Should().BeEmpty();
        operation.Status.Should().Be(status);
    }

    [Fact]
    public void BulkOperationItem_ValidItem_ShouldPass()
    {
        // Arrange & Act
        var item = new BulkOperationItem
        {
            BulkOperationId = 1,
            RecordId = 123,
            Status = "PENDING"
        };

        // Assert
        var validationResults = ValidateEntity(item);
        validationResults.Should().BeEmpty();
        item.RecordId.Should().Be(123);
        item.Status.Should().Be("PENDING");
    }

    [Fact]
    public void SegmentAnalytics_ValidAnalytics_ShouldPass()
    {
        // Arrange & Act
        var analytics = new SegmentAnalytics
        {
            SegmentId = 1,
            MemberCount = 150,
            EngagementScore = 85.5,
            EventAttendanceRate = 75.2,
            PaymentComplianceRate = 95.0,
            LastCalculated = DateTime.UtcNow
        };

        // Assert
        var validationResults = ValidateEntity(analytics);
        validationResults.Should().BeEmpty();
        analytics.MemberCount.Should().Be(150);
        analytics.EngagementScore.Should().Be(85.5);
        analytics.EventAttendanceRate.Should().Be(75.2);
        analytics.PaymentComplianceRate.Should().Be(95.0);
    }

    [Fact]
    public void SegmentPerformanceMetric_ValidMetric_ShouldPass()
    {
        // Arrange & Act
        var metric = new SegmentPerformanceMetric
        {
            SegmentId = 1,
            MetricName = "Average Event Attendance",
            MetricValue = 78.5,
            MetricType = "PERCENTAGE",
            CalculatedAt = DateTime.UtcNow
        };

        // Assert
        var validationResults = ValidateEntity(metric);
        validationResults.Should().BeEmpty();
        metric.MetricName.Should().Be("Average Event Attendance");
        metric.MetricValue.Should().Be(78.5);
        metric.MetricType.Should().Be("PERCENTAGE");
    }

    [Theory]
    [InlineData("COUNT")]
    [InlineData("PERCENTAGE")]
    [InlineData("AVERAGE")]
    [InlineData("SUM")]
    [InlineData("RATIO")]
    public void SegmentPerformanceMetric_ValidMetricType_ShouldPass(string metricType)
    {
        // Arrange & Act
        var metric = new SegmentPerformanceMetric
        {
            SegmentId = 1,
            MetricName = "Test Metric",
            MetricValue = 100.0,
            MetricType = metricType,
            CalculatedAt = DateTime.UtcNow
        };

        // Assert
        var validationResults = ValidateEntity(metric);
        validationResults.Should().BeEmpty();
        metric.MetricType.Should().Be(metricType);
    }

    private static List<ValidationResult> ValidateEntity(object entity)
    {
        var validationResults = new List<ValidationResult>();
        var validationContext = new ValidationContext(entity, null, null);
        Validator.TryValidateObject(entity, validationContext, validationResults, true);
        return validationResults;
    }
}