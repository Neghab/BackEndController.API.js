using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Swashbuckle.AspNetCore.Swagger;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Swagger
{
    public sealed class WithRequestExamples : IOperationFilter
    {
        private readonly IOptions<MvcJsonOptions> _mvcJsonOptions;

        public WithRequestExamples(IOptions<MvcJsonOptions> mvcJsonOptions)
        {
            _mvcJsonOptions = mvcJsonOptions;
        }

        public void Apply(Operation operation, OperationFilterContext context)
        {
            ForEachTarget<SwaggerRequestExampleAttribute>(context,
                x => SetExample(operation, context, x.ExampleType, GetExample(x)));
        }

        private void SetExample(Operation operation, OperationFilterContext context, Type requestType, object example)
        {
            var schemaRegistry = context.SchemaRegistry;
            var schema = schemaRegistry.GetOrRegister(requestType);

            var name = schema.Ref.Split('/').Last();
            var definitionToUpdate = schemaRegistry.Definitions[name];
            var serializerSettings = SerializerSettings();
            definitionToUpdate.Example = FormatJson(example, serializerSettings);
        }

        private void ForEachTarget<T>(OperationFilterContext context, Action<T> action)
        {
            context.ApiDescription
                .ActionAttributes()
                .Concat(context.ApiDescription.ControllerAttributes())
                .OfType<T>()
                .ToList()
                .ForEach(action);
        }

        private object GetExample(SwaggerRequestExampleAttribute attr)
        {
            return GetExample(attr.ExampleType, attr.MethodName);
        }

        private object GetExample(Type type, string methodName)
        {
            // Invoke Parameterless Public Static Method
            var example = type.GetMethod(methodName,
                    BindingFlags.Public | BindingFlags.Static, null, new Type[0], new ParameterModifier[0])
                .Invoke(null, null);
            return example;
        }

        private object FormatJson(object example, JsonSerializerSettings serializerSettings)
        {
            var jsonString = JsonConvert.SerializeObject(example, serializerSettings);
            var result = JsonConvert.DeserializeObject(jsonString);
            return result;
        }

        private JsonSerializerSettings SerializerSettings()
        {
            var serializerSettings = DuplicateSerializerSettings(_mvcJsonOptions.Value.SerializerSettings);
            serializerSettings.NullValueHandling =
                NullValueHandling
                    .Ignore; // ignore nulls on any RequestExample properies because swagger does not support null objects https://github.com/OAI/OpenAPI-Specification/issues/229
            serializerSettings.Converters.Add(new StringEnumConverter());
            return serializerSettings;
        }

        private JsonSerializerSettings DuplicateSerializerSettings(JsonSerializerSettings controllerSerializerSettings)
        {
            if (controllerSerializerSettings == null)
            {
                return new JsonSerializerSettings();
            }

            return new JsonSerializerSettings
            {
                Converters = new List<JsonConverter>(controllerSerializerSettings.Converters),
                CheckAdditionalContent = controllerSerializerSettings.CheckAdditionalContent,
                ConstructorHandling = controllerSerializerSettings.ConstructorHandling,
                Context = controllerSerializerSettings.Context,
                ContractResolver = controllerSerializerSettings.ContractResolver,
                Culture = controllerSerializerSettings.Culture,
                DateFormatHandling = controllerSerializerSettings.DateFormatHandling,
                DateParseHandling = controllerSerializerSettings.DateParseHandling,
                DateTimeZoneHandling = controllerSerializerSettings.DateTimeZoneHandling,
                DefaultValueHandling = controllerSerializerSettings.DefaultValueHandling,
                Error = controllerSerializerSettings.Error,
                Formatting = controllerSerializerSettings.Formatting,
                MaxDepth = controllerSerializerSettings.MaxDepth,
                MissingMemberHandling = controllerSerializerSettings.MissingMemberHandling,
                NullValueHandling = controllerSerializerSettings.NullValueHandling,
                ObjectCreationHandling = controllerSerializerSettings.ObjectCreationHandling,
                PreserveReferencesHandling = controllerSerializerSettings.PreserveReferencesHandling,
                ReferenceLoopHandling = controllerSerializerSettings.ReferenceLoopHandling,
                TypeNameHandling = controllerSerializerSettings.TypeNameHandling,
            };
        }
    }
}
