using Carvana.AppHealth;
using Carvana.AlgoContent.PackagesOptionsAPI.Contracts;
using Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Swagger;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Net;
using System.Threading.Tasks;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Controllers
{
    [ApiVersion("1")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Produces("application/json")]
    public class StatusController : Controller
    {
        private readonly ILogger _logger;

        public StatusController(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger(GetType());
        }

        [HttpGet, Route("")]
        [SwaggerSuccessExample(typeof(AppStatus), nameof(AppStatus.Example))]
        [SwaggerResponse((int)HttpStatusCode.OK, typeof(AppStatus), "App Status")]
        public IActionResult Get()
        {
            return Ok(AppStatus.Current());
        }

        [HttpPost, Route("log")]
        [SwaggerResponse((int)HttpStatusCode.OK, null, "Write To Log")]
        public IActionResult LogTest()
        {
            _logger.LogInformation("Hello, World");
            return Ok();
        }

        [Authorize]
        [HttpGet, Route("authorized")]
        [SwaggerSuccessExample(typeof(AppStatus), nameof(AppStatus.Example))]
        [SwaggerResponse((int)HttpStatusCode.OK, typeof(AppStatus), "App Status")]
        public IActionResult GetAuthorized()
        {
            return Ok(AppStatus.Current());
        }
        
        [HttpGet, Route("health")]
        [SwaggerSuccessExample(typeof(AppHealthDetailsResponse), nameof(AppHealthDetailsResponse.GetExample))]
        [SwaggerResponse((int)HttpStatusCode.OK, typeof(AppHealthDetailsResponse), "App Health")]
        public async Task<IActionResult> GetHealth([FromServices]IAppHealth appHealth)
        {
            var health = await appHealth.Get();
            var statusCode = health.OverallHealth.Equals(HealthStatus.Healthy) ? HttpStatusCode.OK : HttpStatusCode.ServiceUnavailable;
            return new ObjectResult(new AppHealthDetailsResponse(health)) { StatusCode = (int) statusCode }; 
        }
    }
}
