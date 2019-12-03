# Simple Micro Service Template

## Overview 

This template is used to build a simple Microservice hosted in ServiceFabric. The shortname for this template is **sfapi**

### Features

The template includes:

* A ServiceFabric project configured for deployment in DEV, TEST, UAT, and PROD
* A WebAPI project pre-wired for 
    * Auth Server
    * ApplicationInsights
    * Swagger
    * ServiceFabric Hosting
    * Self Hosting 
    * API Versioning
    * and more!

### Usage 

1. Clone the repo for this project 
```
git clone https://carvanadev.visualstudio.com/DefaultCollection/Carvana.Projects/_git/Carvana.VisualStudio
```
2. Navigate to the root directory for the repository 
```
cd Carvana.VisualStudio
```
3. Run the install script 
```
install
```
4. Create and navigate to the directory for your new solution
```
mkdir Carvana.Foo && cd Carvana.Foo
```
5. Use dotnet new to create the solution
```
dotnet new sfapi -n Foo
```

### Deployment 

#### Logging
1. Request Splunk setup from DevOps, they will provide you with tokens for DEV, TEST, UAT, and PROD
2. Update appsettings.\{environment}.json with the appropriate tokens
```
"WriteTo": [
      {
        "Name": "EventCollector",
        "Args": {
          "splunkHost": "https://splunk.carvana.io/services/collector",
          "eventCollectorToken": "PUT YOUR TOKEN HERE"
        }
      }
    ]
```
3. Update this README with your index and token (this will facilitate support) 
## Solution Architecture 

The solution is divided into 5 layers

### 0 - Environment 

This layer is for projects related to how the project is deployed (e.g. ServiceFabric projects, Azure Resource Manager projects)

### 1 - Contracts 

This layer is for projects that define interfaces and models shared accross the solution. 

### 2 - Presentation

This layer is for any projects that *present* functionality (e.g. executables, web applications). This layer is where Infrastructure implementations are 
selected to fulfill Contracts interfaces. 

### 3 - Logic 

This layer is for projects that orchestrate the interfaces defined in Contracts 

### 4 - Infrastructure 

This layer is for projects that take dependencies outside the solution and implement the interfaces defined in Contracts. 

![Layers](doc/images/layers.jpg "Layer Diagrams")

## Dependencies

The key structural layers in this architecture are Contracts, Presentation, Logic, and Infrastructure. 

* **Contracts**: Should have no dependencies, can be referenced by any project.
* **Presentation**: Can depend on any project, but should only directly reference Infrastructure during IoC composition.
* **Logic**: Should only depend on Contracts.
* **Infrastructure**: Should only depend on Contracts and external libraries, should only be referenced by Presentation and unit test projects. 

![Dependency](doc/images/dependency.jpg "Dependency Diagrams")