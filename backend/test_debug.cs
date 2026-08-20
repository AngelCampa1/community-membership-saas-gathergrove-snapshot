using System;

public class DateDebug
{
    public static void Main()
    {
        var startDate = new DateTime(2025, 1, 1);
        var endDate = startDate.AddDays(365); // January 1, 2026
        
        Console.WriteLine($"Start: {startDate:yyyy-MM-dd}");
        Console.WriteLine($"End: {endDate:yyyy-MM-dd}");
        
        var currentDate = startDate;
        int count = 0;
        
        while (currentDate.Date < endDate.Date)
        {
            count++;
            Console.WriteLine($"Event {count}: {currentDate:yyyy-MM-dd}");
            currentDate = currentDate.AddMonths(1);
        }
        
        Console.WriteLine($"Total events: {count}");
        Console.WriteLine($"Next would be: {currentDate:yyyy-MM-dd} which is >= {endDate:yyyy-MM-dd}");
    }
}