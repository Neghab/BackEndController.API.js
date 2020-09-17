# K8s Template

## Overview 

This is common template is used to deploy a simple Node service on K8s.

### Features

The template includes:

* Helm Chart
* Deployment files for K8s
    - deployment
    - configmap
    - hpa (horizontal pod autoscale)
    - ingress
    = pdb (pod disruption budget)
    - service
* Value files for K8s environments
    - local
    - sandbox
    - dev
    - test
    - uat
    - production


## Running on K8s Dev clusters
Assumption: You have a working Node service which is dockerized

To deploy the Node service project on K8s Dev clusters:

1. Open Self Service ticket - https://jira.carvana.com/servicedesk/customer/portal/11/group/180
- If its existing application in production(not on K8s) use the K8s Migration ticket
- If its a new appplication, not in production(on K8s) use the New K8s ticket


2. Once the ticket has been completed by DevOps, you will have a pipeline for your project in VSTS. Run the pipeline to deploy the application to K8s Dev clusters.

3. To test the application use browser OR curl OR postman: https://apps.zagforward.com/<namespace>/path