using System.Linq;
using Swashbuckle.AspNetCore.Swagger;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Swagger
{
    public sealed class WithAllParametersRequired : IOperationFilter
    {
        public void Apply(Operation operation, OperationFilterContext context)
        {
            if (operation.Parameters == null || !operation.Parameters.Any())
            {
                return;
            }

            SetBodyParametersAsRequired(operation);
            SetQueryStringParametersAsRequired(operation);
        }

        private void SetBodyParametersAsRequired(Operation operation)
        {
            foreach (var p in operation.Parameters.Where(p => p.In == "body"))
                p.Required = true;
        }

        private void SetQueryStringParametersAsRequired(Operation operation)
        {
            foreach (var p in operation.Parameters.Where(p => p.In == "query"))
                p.Required = true;
        }
    }
}
