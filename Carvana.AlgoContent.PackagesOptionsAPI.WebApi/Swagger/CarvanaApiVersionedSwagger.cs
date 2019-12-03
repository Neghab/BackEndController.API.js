using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Versioning;
using Microsoft.AspNetCore.Rewrite;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using Swashbuckle.AspNetCore.Swagger;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Swagger
{
    public static class MicrosoftRouteApiVersions
    {
        public static void AddCarvanaSwagger(this IServiceCollection services, string serviceName, bool shouldIncludeXmlDoc)
        {
            services.AddRouteApiVersioning();
            services.AddSwaggerGen(options =>
            {
                options.DescribeAllEnumsAsStrings();
                options.DocInclusionPredicate((version, apiDescription) =>
                {
                    var include = IncludeDocument(apiDescription,version);
                    if (include)
                    {
                        ReplaceVersionDescriptions(apiDescription,version);
                    }
                    return include;
                });

                var provider = services.BuildServiceProvider().GetRequiredService<IApiVersionDescriptionProvider>();

                options.DocumentFilter<WithLowercaseUrls>();
                options.OperationFilter<WithAuthHeader>();
                options.OperationFilter<WithAuthRolesAndPolicies>();
                options.OperationFilter<WithRequestExamples>();
                options.OperationFilter<WithSuccessResponseExamples>();
                options.OperationFilter<WithAllParametersRequired>();
                options.AddSecurityDefinition("Bearer", new ApiKeyScheme()
                {
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                    Name = "Authorization",
                    In = "header",
                    Type = "apiKey"
                });

                foreach (var apiVersionDescription in provider.ApiVersionDescriptions)
                    options.SwaggerDoc(apiVersionDescription.GroupName, new Info
                    {
                        Title = $"{serviceName} API {apiVersionDescription.ApiVersion}",
                        Version = apiVersionDescription.ApiVersion.ToString(),
                        Description = $"{serviceName} API" + (apiVersionDescription.IsDeprecated ? " - This API version has been deprecated." : string.Empty),
                        Contact = new Contact { Name = "Carvana" }
                    });

                if (shouldIncludeXmlDoc)
                {
                    try
                    {
                        options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory,
                            typeof(Startup).GetTypeInfo().Assembly.GetName().Name + ".xml"));
                    }
                    catch (Exception exception)
                    {
                        Log.Error(exception, "Failed to include xml comments");
                    }
                }
            });
        }

        private static void AddRouteApiVersioning(this IServiceCollection services)
        {
            services.AddApiVersioning(apiVersionOptions =>
            {
                apiVersionOptions.ReportApiVersions = true;
                apiVersionOptions.ApiVersionReader = new UrlSegmentApiVersionReader();
            });

            services.AddMvcCore().AddVersionedApiExplorer(o => o.GroupNameFormat = "'v'VVV");
        }
        
        private static bool IncludeDocument(ApiDescription apiDescription, string version)
        {
            if (apiDescription.GroupName != version)
            {
                return false; 
            }

            var actionVersions = apiDescription.ActionAttributes().OfType<MapToApiVersionAttribute>().SelectMany(attr => attr.Versions).ToList();
            var controllerVersions = apiDescription.ControllerAttributes().OfType<ApiVersionAttribute>().SelectMany(attr => attr.Versions).ToList();
            var controllerAndActionVersionsOverlap = controllerVersions.Intersect(actionVersions).Any();
            if(controllerAndActionVersionsOverlap)
            {
                return false;
            }
            return controllerVersions.Any(v => $"v{v.ToString()}" == version);
        }

        private static void ReplaceVersionDescriptions(ApiDescription apiDescription, string version)
        {
            apiDescription.RelativePath = apiDescription.RelativePath.Replace("/v{version}", $"/{version}");

            var versionParameter =
                apiDescription.ParameterDescriptions.SingleOrDefault(p => p.Name == "version");

            if (versionParameter != null)
                apiDescription.ParameterDescriptions.Remove(versionParameter);
        }

        public static void UseCarvanaSwagger(this IApplicationBuilder app, string baseUri, string serviceName)
        {
            var apiVersions = app.ApplicationServices.GetService<IApiVersionDescriptionProvider>();

            app.UseRewriter(new RewriteOptions().AddRedirect("^swagger$", $"{baseUri}/swagger/"));
            app.UseSwagger(options => { options.PreSerializeFilters.Add((document, request) => { document.BasePath = $"{baseUri}/"; }); });
            app.UseSwaggerUI(options =>
            {
                options.DocumentTitle($"{serviceName} - Carvana");
                foreach (var apiVersionDescription in apiVersions.ApiVersionDescriptions)
                    options.SwaggerEndpoint($"{apiVersionDescription.GroupName}/swagger.json", apiVersionDescription.GroupName.ToUpperInvariant());
            });
        }
    }
}
