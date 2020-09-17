SUBSCRIPTION=Carvana-Sandbox
RESOURCEGROUP=HarmanjitTestRG
CLUSTERNAME=HarmanjitTestClusterWestNew
SERVICENAME=algo-packagesoptions-api
APPIMAGENAME=harmanjittestcontainerregistry.azurecr.io/$SERVICENAME
NAMESPACE=default
CONTAINERREGISTRY=HarmanjitTestContainerRegistry

az login --service-principal -u $SERVICEPRINCIPAL -p $PASSWORD --tenant $TENANTID
az cloud set --name AzureCloud
az account set --subscription "$SUBSCRIPTION"
az aks get-credentials --resource-group $RESOURCEGROUP --name $CLUSTERNAME
az acr login --name HarmanjitTestContainerRegistry

commit=$(git rev-parse --short HEAD 2> /dev/null | sed "s/\(.*\)/\1/")
if [ -z "$commit" ]
then
commit=$envcommit
fi
echo "this is the commit id we got <$commit>"

exists=`az acr repository show --name $CONTAINERREGISTRY --image $SERVICENAME:$commit -o json`
if [ -z "$exists" ]
then
echo image does not exists...building
docker build -t $APPIMAGENAME:$commit .
docker tag $APPIMAGENAME:$commit $APPIMAGENAME:latest
docker push $APPIMAGENAME:$commit 
docker push $APPIMAGENAME:latest
else
echo image exists
fi

docker images
cd Deployments/$SERVICENAME

cat ./values-sandbox.yaml
echo $commit
cat ./values-sandbox.yaml|sed "s/\#{commit}\#/$commit/g">./runtimevalues.yaml

cat ./runtimevalues.yaml

cd ../

helm upgrade  --install --values ./$SERVICENAME/runtimevalues.yaml --wait $SERVICENAME ./$SERVICENAME

status=`kubectl get deployment $SERVICENAME -n $NAMESPACE -o json|jq '.status.conditions[]| select(.type == "Available") | .status'`
echo $status
targetsts="\"False\""
echo $output
if [ "$status" = "$targetsts" ]
then
echo rolling back deployment to previous one
kubectl rollout undo deployment $SERVICENAME -n $NAMESPACE
else
echo successful deployment
fi