using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Swashbuckle.AspNetCore.Swagger;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Swagger
{
    public sealed class WithAuthRolesAndPolicies : IOperationFilter
    {
        public void Apply(Operation operation, OperationFilterContext context)
        {
            var authorizeAttributes = context.ApiDescription
                .ActionAttributes()
                .Concat(context.ApiDescription.ControllerAttributes())
                .OfType<AuthorizeAttribute>()
                .ToList();

            if (context.ApiDescription.ActionAttributes().OfType<AllowAnonymousAttribute>().Any())
                return;
            if (!authorizeAttributes.Any()) 
                return;
            
            var authorizationDescription = new StringBuilder(" (Auth");
            AppendPolicies(authorizeAttributes, authorizationDescription);
            AppendRoles(authorizeAttributes, authorizationDescription);
            operation.Summary += authorizationDescription.ToString().TrimEnd(';') + ")";
        }

        private static void AppendPolicies(IEnumerable<AuthorizeAttribute> authorizeAttributes, StringBuilder authorizationDescription)
        {
            var policies = authorizeAttributes
                .Where(a => !string.IsNullOrEmpty(a.Policy))
                .Select(a => a.Policy)
                .OrderBy(policy => policy)
                .ToList();

            if (policies.Any())
                authorizationDescription.Append($" Policies: {string.Join(", ", policies)};");
        }

        private static void AppendRoles(IEnumerable<AuthorizeAttribute> authorizeAttributes, StringBuilder authorizationDescription)
        {
            var roles = authorizeAttributes
                .Where(a => !string.IsNullOrEmpty(a.Roles))
                .Select(a => a.Roles)
                .OrderBy(role => role)
                .ToList();

            if (roles.Any())
                authorizationDescription.Append($" Roles: {string.Join(", ", roles)};");
        }
    }
}
