using System;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Swagger
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public sealed class SwaggerSuccessExampleAttribute : Attribute
    {
        public Type ExampleType { get; }
        public string MethodName { get; }
        public int StatusCode { get; }

        public SwaggerSuccessExampleAttribute(Type exampleType, string methodName, int statusCode = 200)
        {
            ExampleType = exampleType;
            MethodName = methodName;
            StatusCode = statusCode;
        }
    }
}
