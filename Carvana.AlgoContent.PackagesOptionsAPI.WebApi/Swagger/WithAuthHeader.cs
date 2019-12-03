using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Swashbuckle.AspNetCore.Swagger;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Swagger
{
    public sealed class WithAuthHeader : IOperationFilter
    {
        public void Apply(Operation operation, OperationFilterContext context)
        {
            var authAttributes = context.ApiDescription
                .ControllerAttributes()
                .Union(context.ApiDescription.ActionAttributes())
                .OfType<AuthorizeAttribute>();

            if (!authAttributes.Any()) 
                return;
            
            if (!operation.Responses.ContainsKey("401"))
                operation.Responses.Add("401", new Response { Description = "Unauthorized" });
            if (operation.Parameters == null)
                operation.Parameters = new List<IParameter>();
            operation.Parameters.Add(new NonBodyParameter()
            {
                Name = "Authorization",
                In = "header",
                Description = "access token",
                Required = false,
                Type = "string"
            });
        }
    }
}
