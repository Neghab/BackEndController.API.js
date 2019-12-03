using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Configuration
{
    public static class CarvanaAuth
    {
        public static void AddCarvanaAuth(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddCarvanaAuth(configuration[ConfigurationConstants.AUTH_SERVER_AUTHORITY_URL], configuration[ConfigurationConstants.REQUIRED_SCOPES]?.Split(' '));
        }

        private static void AddCarvanaAuth(this IServiceCollection services, string authServerBaseUrl, string[] requiredScopes)
        {
            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(o =>
                {
                    o.Authority = authServerBaseUrl;
                    o.Audience = $"{authServerBaseUrl}/resources";
                });
            services
                .AddAuthorization(options =>
                {
                    options.AddPolicy("RequiredScopes",
                        policy => policy.RequireClaim("scope", requiredScopes));
                });
        }
    }
}
