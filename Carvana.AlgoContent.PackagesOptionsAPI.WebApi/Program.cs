using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Configuration;
using Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Logging;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.ServiceFabric.Services.Runtime;
using Serilog;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi
{
    internal static class Program
    {
        private static readonly ILogger Log = ConfigurationFactory.GetConfigurationRoot().CreateCarvanaLogger();
        /// <summary>
        ///     This is the entry point of the service host process.
        /// </summary>
        private static void Main()
        {
          
            try
            {
                var hostSettings = GetHostingSettings();
                if (hostSettings.SelfHost)
                {
                    Log.Information($"Self hosting on Port {hostSettings.Port}");
                    SelfHost(hostSettings.Port);
                    return;
                }
                Log.Information($"Hosting in ServiceFabric");
                ServiceFabricHost();
            }
            catch (Exception ex)
            {
                Log.Error(ex, $"Error in Main of {typeof(Program).Namespace}.{nameof(Program)}");
                throw;
            }
        }

        private static HostingSettings GetHostingSettings()
        {
            var hostSettings = new HostingSettings();
            ConfigurationFactory.GetConfigurationRoot().GetSection(nameof(HostingSettings)).Bind(hostSettings);
            return hostSettings;
        }

        private static void SelfHost(int port)
        {
            var builder = new WebHostBuilder()
                .UseKestrel()
                .UseConfiguration(ConfigurationFactory.GetConfigurationRoot())
                .UseContentRoot(Directory.GetCurrentDirectory())
                .UseStartup<Startup>()
                .UseApplicationInsights()
                .UseUrls($"http://localhost:{port}")
                .Build();

            builder.Run();
        }

        private static void ServiceFabricHost()
        {
            try
            {
                // The ServiceManifest.XML file defines one or more service type names.
                // Registering a service maps a service type name to a .NET type.
                // When Service Fabric creates an instance of this service type,
                // an instance of the class is created in this host process.

                ServiceRuntime.RegisterServiceAsync("Carvana.AlgoContent.PackagesOptionsAPI.WebApiType",
                    context => new WebApi(context)).GetAwaiter().GetResult();

                ServiceEventSource.Current.ServiceTypeRegistered(Process.GetCurrentProcess().Id, typeof(WebApi).Name);

                // Prevents this host process from terminating so services keeps running. 
                Thread.Sleep(Timeout.Infinite);
            }
            catch (Exception e)
            {
                ServiceEventSource.Current.ServiceHostInitializationFailed(e.ToString());
                throw;
            }
        }
    }
}
