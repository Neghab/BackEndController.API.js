using System;
using System.Reflection;

namespace Carvana.AlgoContent.PackagesOptionsAPI.Contracts
{
    public struct AppStatus
    {
        private static readonly string _assemblyVersion =
            Assembly.GetEntryAssembly().GetCustomAttribute<AssemblyInformationalVersionAttribute>().InformationalVersion;

        public string Message { get; set; }
        public string Version { get; set; }
        public DateTimeOffset StatusDateTime { get; set; }

        public static AppStatus Current() => new AppStatus
        {
            Message = "Carvana.AlgoContent.PackagesOptionsAPI Service online.",
            Version = _assemblyVersion,
            StatusDateTime = DateTimeOffset.UtcNow
        };

        public static AppStatus Example() => Current();
    }
}
