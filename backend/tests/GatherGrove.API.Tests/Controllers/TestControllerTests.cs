using NUnit.Framework;
using Microsoft.AspNetCore.Mvc;
using GatherGrove.Application.DTOs;

namespace GatherGrove.API.Tests.Controllers
{
    [TestFixture]
    public class TestControllerTests
    {
        [Test]
        public void SimpleTest_Works()
        {
            // Arrange
            var response = new MultiSessionEventResponse
            {
                Id = 1,
                ClubId = 2,
                Name = "Test"
            };

            // Act & Assert
            Assert.That(response.Id, Is.EqualTo(1));
        }
    }
}