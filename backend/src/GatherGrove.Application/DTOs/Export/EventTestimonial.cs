namespace GatherGrove.Application.DTOs.Export;

public class EventTestimonial
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public int MemberId { get; set; }
    public string Testimonial { get; set; } = string.Empty;
    public int Rating { get; set; }
    public DateTime SubmittedDate { get; set; }
    public bool IsPublic { get; set; }
    public string MemberName { get; set; } = string.Empty;
}