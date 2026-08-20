using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GatherGrove.Domain.Entities
{
    /// <summary>
    /// Tracks member profile completeness for engagement scoring
    /// </summary>
    public class ProfileCompletenessTracking
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int MemberId { get; set; }

        [ForeignKey("MemberId")]
        public Member Member { get; set; } = null!;

        /// <summary>
        /// Overall profile completion percentage (0-100)
        /// </summary>
        [Range(0, 100)]
        public decimal CompletionPercentage { get; set; }

        /// <summary>
        /// Total number of required profile fields
        /// </summary>
        public int RequiredFieldsTotal { get; set; }

        /// <summary>
        /// Number of required fields that are completed
        /// </summary>
        public int RequiredFieldsCompleted { get; set; }

        /// <summary>
        /// Total number of optional profile fields
        /// </summary>
        public int OptionalFieldsTotal { get; set; }

        /// <summary>
        /// Number of optional fields that are completed
        /// </summary>
        public int OptionalFieldsCompleted { get; set; }

        /// <summary>
        /// JSON array of field names that are incomplete
        /// </summary>
        [Column(TypeName = "text")]
        public string IncompleteFields { get; set; } = "[]";

        /// <summary>
        /// JSON array of field names that were recently completed
        /// </summary>
        [Column(TypeName = "text")]
        public string RecentlyCompletedFields { get; set; } = "[]";

        /// <summary>
        /// When this completeness assessment was calculated
        /// </summary>
        [Required]
        public DateTime CalculatedAt { get; set; }

        /// <summary>
        /// When this record was created
        /// </summary>
        [Required]
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// When this record was last updated
        /// </summary>
        [Required]
        public DateTime UpdatedAt { get; set; }

        /// <summary>
        /// Calculate the overall completion percentage
        /// </summary>
        public void CalculateCompletionPercentage()
        {
            if (RequiredFieldsTotal == 0 && OptionalFieldsTotal == 0)
            {
                CompletionPercentage = 100;
                return;
            }

            // Required fields carry 70% weight, optional fields 30%
            decimal requiredWeight = RequiredFieldsTotal > 0 ? 0.7m : 0m;
            decimal optionalWeight = OptionalFieldsTotal > 0 ? 0.3m : 0m;

            // If no required fields exist, optional fields get full weight
            if (RequiredFieldsTotal == 0)
            {
                optionalWeight = 1.0m;
            }
            // If no optional fields exist, required fields get full weight
            else if (OptionalFieldsTotal == 0)
            {
                requiredWeight = 1.0m;
            }

            decimal requiredScore = RequiredFieldsTotal > 0
                ? ((decimal)RequiredFieldsCompleted / RequiredFieldsTotal) * requiredWeight * 100
                : 0;

            decimal optionalScore = OptionalFieldsTotal > 0
                ? ((decimal)OptionalFieldsCompleted / OptionalFieldsTotal) * optionalWeight * 100
                : 0;

            CompletionPercentage = Math.Round(requiredScore + optionalScore, 2);
        }

        /// <summary>
        /// Get engagement weight based on completion percentage
        /// </summary>
        /// <returns>Weight multiplier for engagement scoring</returns>
        public decimal GetEngagementWeight()
        {
            return CompletionPercentage switch
            {
                >= 90 => 1.2m,  // Nearly complete profile
                >= 70 => 1.0m,  // Well-filled profile
                >= 50 => 0.8m,  // Partially complete
                >= 25 => 0.6m,  // Minimal completion
                _ => 0.4m       // Very incomplete
            };
        }

        /// <summary>
        /// Check if profile completeness meets engagement threshold
        /// </summary>
        /// <param name="threshold">Minimum completion percentage required</param>
        /// <returns>True if profile meets threshold</returns>
        public bool MeetsThreshold(decimal threshold = 60m)
        {
            return CompletionPercentage >= threshold;
        }

        /// <summary>
        /// Get the most critical missing fields for completion
        /// </summary>
        /// <returns>Array of critical missing field names</returns>
        public string[] GetCriticalMissingFields()
        {
            // This would parse the IncompleteFields JSON and return
            // the most important missing fields based on business rules
            var incompleteFieldsList = System.Text.Json.JsonSerializer
                .Deserialize<string[]>(IncompleteFields) ?? Array.Empty<string>();

            // Priority order for required fields
            var criticalFields = new[] { "FullName", "Email", "PhoneNumber", "Address" };

            return incompleteFieldsList
                .Where(field => criticalFields.Contains(field))
                .Take(3)
                .ToArray();
        }

        /// <summary>
        /// Calculate improvement since last check
        /// </summary>
        /// <param name="previousTracking">Previous completeness tracking record</param>
        /// <returns>Percentage point improvement</returns>
        public decimal CalculateImprovement(ProfileCompletenessTracking? previousTracking)
        {
            if (previousTracking == null) return CompletionPercentage;
            return CompletionPercentage - previousTracking.CompletionPercentage;
        }
    }
}