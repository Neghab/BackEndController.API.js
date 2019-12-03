using Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Configuration;
using Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Logging;
using Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Swagger;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi
{
    public sealed class Startup
    {
        private readonly IConfiguration _configuration;
        
        public Startup(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        
        public void ConfigureServices(IServiceCollection services)
        {
            IoCConfig.RegisterDependencyChain(_configuration, services);
            services.AddCarvanaLogging(_configuration);
            services.AddApplicationInsightsTelemetry(_configuration);
            services.AddCarvanaAuth(_configuration);
            services.AddCarvanaHealthChecks();
            services.AddCors();
            services.AddMemoryCache();
            services.AddResponseCompression(options => { options.Providers.Add<GzipCompressionProvider>(); });
            services.AddCarvanaSwagger("AlgoContent.PackagesOptionsAPI", shouldIncludeXmlDoc: true);
            services.AddMvc(o => o.Filters.Add(new LogUnhandledExceptions()))
                .AddJsonOptions(options =>
                {
                    options.SerializerSettings.Formatting = Formatting.Indented;
                    options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
                    options.SerializerSettings.DateTimeZoneHandling = DateTimeZoneHandling.Utc;
                    options.SerializerSettings.DateFormatHandling = DateFormatHandling.IsoDateFormat;
                    options.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                    options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter());
                });
        }
        
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            if (!env.IsEnvironment("PROD"))
                app.UseDeveloperExceptionPage();
            
            app.UseCors(corsPolicyBuilder => corsPolicyBuilder.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());
            app.UseCarvanaSwagger(_configuration.GetSection("SwaggerOptions").GetValue<string>("BasePath"), "AlgoContent.PackagesOptionsAPI");
            app.UseResponseCompression();
            app.UseAuthentication();
            app.UseMvc();
            
            app.StartHealthChecks();
        }
    }
}
