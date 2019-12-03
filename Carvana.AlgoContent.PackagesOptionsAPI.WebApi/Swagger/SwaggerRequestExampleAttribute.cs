using System;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Swagger
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public sealed class SwaggerRequestExampleAttribute : Attribute
    {
        public Type ExampleType { get; }
        public string MethodName { get; }

        public SwaggerRequestExampleAttribute(Type exampleType, string methodName)
        {
            ExampleType = exampleType;
            MethodName = methodName;
        }
    }
}
