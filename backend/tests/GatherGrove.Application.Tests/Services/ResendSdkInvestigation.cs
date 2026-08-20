using NUnit.Framework;
using Resend;
using System.Reflection;

namespace GatherGrove.Application.Tests.Services;

/// <summary>
/// Investigation test to explore Resend SDK API capabilities
/// </summary>
[TestFixture]
public class ResendSdkInvestigation
{
    [Test]
    [Explicit("SDK Investigation - run manually")]
    public void InvestigateEmailMessageProperties()
    {
        // Create an EmailMessage instance to inspect
        var message = new EmailMessage();

        // Get all properties using reflection
        var properties = typeof(EmailMessage).GetProperties(BindingFlags.Public | BindingFlags.Instance);

        Console.WriteLine("=== EmailMessage Properties ===");
        foreach (var prop in properties)
        {
            Console.WriteLine($"- {prop.Name}: {prop.PropertyType.Name}");

            // Check if it's a collection
            if (prop.PropertyType.IsGenericType)
            {
                var genericArgs = prop.PropertyType.GetGenericArguments();
                Console.WriteLine($"  Generic Type: {string.Join(", ", genericArgs.Select(t => t.Name))}");
            }
        }

        // Check for Attachments specifically
        var attachmentsProp = properties.FirstOrDefault(p => p.Name == "Attachments");
        if (attachmentsProp != null)
        {
            Console.WriteLine("\n✅ FOUND: Attachments property exists!");
            Console.WriteLine($"Type: {attachmentsProp.PropertyType.FullName}");

            // Try to instantiate and explore the type
            var attachmentsValue = attachmentsProp.GetValue(message);
            Console.WriteLine($"Default Value: {attachmentsValue}");
            Console.WriteLine($"Is Null: {attachmentsValue == null}");

            if (attachmentsValue != null)
            {
                var attachmentsType = attachmentsValue.GetType();
                Console.WriteLine($"Runtime Type: {attachmentsType.FullName}");

                // If it's a collection, check what type it holds
                if (attachmentsType.IsGenericType)
                {
                    var itemType = attachmentsType.GetGenericArguments()[0];
                    Console.WriteLine($"\nAttachment Item Type: {itemType.FullName}");

                    // Explore the attachment type properties
                    var attachmentProps = itemType.GetProperties(BindingFlags.Public | BindingFlags.Instance);
                    Console.WriteLine("\nAttachment Properties:");
                    foreach (var aProp in attachmentProps)
                    {
                        Console.WriteLine($"  - {aProp.Name}: {aProp.PropertyType.Name}");
                    }
                }
            }
        }
        else
        {
            Console.WriteLine("\n❌ NO Attachments property found!");
        }

        // Look for any attachment-related properties
        Console.WriteLine("\n=== Searching for attachment-related properties ===");
        var attachmentRelated = properties.Where(p =>
            p.Name.ToLower().Contains("attach") ||
            p.Name.ToLower().Contains("file"));

        foreach (var prop in attachmentRelated)
        {
            Console.WriteLine($"Found: {prop.Name} ({prop.PropertyType.Name})");
        }
    }

    [Test]
    [Explicit("SDK Investigation - run manually")]
    public void InvestigateResendClientMethods()
    {
        // Inspect IResend interface
        var methods = typeof(IResend).GetMethods(BindingFlags.Public | BindingFlags.Instance);

        Console.WriteLine("=== IResend Methods ===");
        foreach (var method in methods)
        {
            Console.WriteLine($"\n{method.Name}");
            Console.WriteLine($"  Returns: {method.ReturnType.Name}");

            var parameters = method.GetParameters();
            if (parameters.Length > 0)
            {
                Console.WriteLine("  Parameters:");
                foreach (var param in parameters)
                {
                    Console.WriteLine($"    - {param.Name}: {param.ParameterType.Name}");
                }
            }
        }

        // Look for attachment-related methods
        Console.WriteLine("\n=== Attachment-related Methods ===");
        var attachmentMethods = methods.Where(m =>
            m.Name.ToLower().Contains("attach"));

        foreach (var method in attachmentMethods)
        {
            Console.WriteLine($"Found: {method.Name}");
        }
    }

    [Test]
    [Explicit("SDK Investigation - run manually")]
    public void ListAllResendTypes()
    {
        var assembly = typeof(IResend).Assembly;
        var types = assembly.GetTypes();

        Console.WriteLine($"=== All Types in Resend Assembly ({types.Length} total) ===\n");

        // Group by namespace
        var grouped = types.GroupBy(t => t.Namespace ?? "No Namespace");

        foreach (var group in grouped.OrderBy(g => g.Key))
        {
            Console.WriteLine($"\n{group.Key}:");
            foreach (var type in group.OrderBy(t => t.Name))
            {
                Console.WriteLine($"  - {type.Name}");
            }
        }

        // Look specifically for attachment-related types
        Console.WriteLine("\n\n=== Attachment-Related Types ===");
        var attachmentTypes = types.Where(t =>
            t.Name.ToLower().Contains("attach") ||
            t.Name.ToLower().Contains("file"));

        foreach (var type in attachmentTypes)
        {
            Console.WriteLine($"\n{type.FullName}");
            if (type.IsClass)
            {
                var props = type.GetProperties(BindingFlags.Public | BindingFlags.Instance);
                foreach (var prop in props)
                {
                    Console.WriteLine($"  - {prop.Name}: {prop.PropertyType.Name}");
                }
            }
        }
    }
}
