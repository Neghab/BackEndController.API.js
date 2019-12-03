using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Filters;
using Serilog;

namespace Carvana.AlgoContent.PackagesOptionsAPI.WebApi.Logging
{
    public sealed class LogUnhandledExceptions : IExceptionFilter, IAsyncExceptionFilter
    {
        private static readonly ILogger Log = Serilog.Log.ForContext<LogUnhandledExceptions>();

        public Task OnExceptionAsync(ExceptionContext context)
        {
            Log.Error(context.Exception, "Unhandled Exception for '{httpMethod} {httpPath}' - '{message}'", 
                context.HttpContext.Request.Method, context.HttpContext.Request.Path, context.Exception.Message);
            return Task.CompletedTask;
        }

        public void OnException(ExceptionContext context)
        {
            Log.Error(context.Exception, "Unhandled Exception for '{httpMethod} {httpPath}' - '{message}'",
                context.HttpContext.Request.Method, context.HttpContext.Request.Path, context.Exception.Message);
        }
    }
}
