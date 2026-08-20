namespace GatherGrove.Domain.Enums
{
    /// <summary>
    /// Represents the engagement level classification for members
    /// </summary>
    public enum EngagementLevel
    {
        /// <summary>
        /// Highly Engaged - Score 70-100 (Green indicator)
        /// </summary>
        Green = 1,
        High = 1, // Alias for Green

        /// <summary>
        /// Moderately Engaged - Score 40-69 (Yellow indicator)
        /// </summary>
        Yellow = 2,
        Medium = 2, // Alias for Yellow

        /// <summary>
        /// At Risk - Score 0-39 (Red indicator)
        /// </summary>
        Red = 3,
        Low = 3, // Alias for Red
        VeryLow = 3 // Alias for Red
    }
}