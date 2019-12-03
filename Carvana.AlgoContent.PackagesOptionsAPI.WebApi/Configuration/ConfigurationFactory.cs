using System;
using System.IO;
using Microsoft.Extensions.Configuration;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Configuration
{
    public class ConfigurationFactory
    {
        public static IConfigurationRoot GetConfigurationRoot()
        {
            var aspnetCoreEnvironment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            return new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", false)
                .AddJsonFile($"appsettings.{aspnetCoreEnvironment}.json", true)
                .Build();
        }
    }
}
