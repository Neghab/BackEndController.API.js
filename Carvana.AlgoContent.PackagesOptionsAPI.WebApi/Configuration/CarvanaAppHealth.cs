using System;
using Carvana.AppHealth;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Configuration
{
    public static class CarvanaAppHealth
    {
        public static void AddCarvanaHealthChecks(this IServiceCollection services)
        {
            services.AddSingleton<IAppHealth>(x => new PeriodicAppHealth(TimeSpan.FromMinutes(1), 
                new CurrentAppHealth(
                    new SimpleHealthComponent("Insert Your App Component Here", () => HealthStatus.Healthy),
                    new SimpleHealthComponent("Insert Your Next App Component Here", () => HealthStatus.Healthy)
                )));
        }

        public static void StartHealthChecks(this IApplicationBuilder appBuilder)
        {
            // Resolving the instance begins the health checks.
            appBuilder.ApplicationServices.GetService(typeof(IAppHealth));
        }
    }
}
