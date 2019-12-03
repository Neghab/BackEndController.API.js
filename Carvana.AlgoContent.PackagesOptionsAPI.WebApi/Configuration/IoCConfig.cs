using Carvana.Utility.Decrypt;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Configuration
{
    public class IoCConfig
    {
        public static void RegisterDependencyChain(IConfiguration configuration, IServiceCollection services)
        {
        }

        public static TSettings GetSettings<TSettings>(IConfiguration configuration) where TSettings : new()
        {
            var settings = new TSettings();
            configuration.GetSection(settings.GetType().Name).Bind(settings);
            return settings;
        }

        private static string DecryptConnectionString(IConfiguration configuration, string connectionStringName)
        {
            var thumbprint = configuration[ConfigurationConstants.DECRYPTION_CERT_THUMBPRINT];
            var connectionString = configuration.GetConnectionString(connectionStringName);
            return new DecryptConnectionString().Decrypt(connectionString, thumbprint);
            
        }
    }
}
