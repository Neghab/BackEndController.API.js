using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Logging
{
    public static class CarvanaSerilog
    {
        public static void AddCarvanaLogging(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddLogging(o =>
            {
                o.AddConfiguration(configuration.GetSection("Logging"));
                o.AddSerilog(configuration.CreateCarvanaLogger());
            });
        }

        public static Serilog.ILogger CreateCarvanaLogger(this IConfiguration config)
        {
            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(config)
                .Enrich.FromLogContext()
                .CreateLogger();

            return Log.Logger;
        }
    }
}
