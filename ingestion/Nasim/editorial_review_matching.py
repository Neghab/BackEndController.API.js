import re
import pandas as pd
from azure.cosmos import exceptions, CosmosClient, PartitionKey



def main():
    # Initializing the Cosmos client
    endpoint = "https://cvna-algocontent-dev.documents.azure.com:443/"
    key = "xIejmSxs4eBbyrQeQWx7DKvmqjdep0gWx0ctJftC9IaWGmjzVH9tI71q8uuOFB0KKul3zIRRPyYkaCDgZWShlA=="    

    # create_cosmos_client
    client = CosmosClient(endpoint, key)

    # Initializing a database
    database_name = "packagesoptions-vehicle"
    database = client.create_database_if_not_exists(id=database_name)

    container_name = "cvna-algocontent"
    container = database.create_container_if_not_exists(
        id=container_name, 
        partition_key=PartitionKey(path="/ymmtId"),
        offer_throughput=400
    )


    # Query these items using the SQL query syntax. 
    query = "SELECT * FROM c WHERE c.ymmtis IN ('2019-00000897-00037266-00351327')"
    
    items = list(container.query_items(
        query=query,
        enable_cross_partition_query=True
        ) )
    
    request_charge = container.client_connection.last_response_headers['x-ms-request-charge']


    print(items)
    print('Query returned {0} items. Operation consumed {1} request units'.format(len(items), request_charge))


    

if __name__ == '__main__':
	main()