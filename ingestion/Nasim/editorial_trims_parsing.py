import pandas as pd
import re
# import json
import numpy as np
from azure.cosmos import exceptions, CosmosClient, PartitionKey
from pandas.core.dtypes.missing import isnull

def cosmos_connection():
	# Initializing the Cosmos client
	endpoint = "https://cvna-algocontent-dev.documents.azure.com:443/"
	key = "xIejmSxs4eBbyrQeQWx7DKvmqjdep0gWx0ctJftC9IaWGmjzVH9tI71q8uuOFB0KKul3zIRRPyYkaCDgZWShlA=="    

    # create_cosmos_client
	client = CosmosClient(endpoint, key)

    # Initializing a database
	database_name = "cvna-algocontent"
	database = client.create_database_if_not_exists(id=database_name)

	container_name = "packagesoptions-vehicle"
	container = database.create_container_if_not_exists(
    	id=container_name, 
		partition_key=PartitionKey(path="/ymmtId"),
    	offer_throughput=400
	)
	return container

def cosmos_data():
	container = cosmos_connection()

	query = ''' SELECT DISTINCT c.ymmtId, c.make, c.make_id,c.model,c.model_id,c.year,c.year_id,c.trim,c.trim_id FROM c '''
    
	items = list(container.query_items(
    	query=query,
    	enable_cross_partition_query=True
    	) )
	return items

def makes_data():
	container = cosmos_connection()

	query = '''SELECT DISTINCT c.make, c.make_id FROM c '''
    
	items = list(container.query_items(
    	query=query,
    	enable_cross_partition_query=True
    	) )
	return items


def main():
	container = cosmos_connection()
	ymmt_data = cosmos_data()
	
	df_ymmt = pd.DataFrame(ymmt_data)
	# print(df_ymmt.query(str(df_ymmt["ymmtId"]) == "2020-00000897-00037094"))
	

	# print(df_ymmt.loc[df_ymmt["trim"].isna()])
	# df_NoTrim = df_ymmt.loc[df_ymmt["trim"].isna()]
	# df_WithTrim =df_ymmt.loc[df_ymmt["trim"].notna()]

	# makes = makes_data()	
	csv_file = "/Users/NTavakol/carv_document_Nasim/AC_Editorial/Final_Trim Spreadsheet_Sheet1.csv"
	path = "/Users/NTavakol/carv_document_Nasim/AC_Editorial/"
	

	
	df_trims = pd.read_csv(csv_file, header='infer')
	df_trims.rename(columns={"ID_1": "ID", "ID_2": "options_string"}, inplace=True)
	df_trims["trim"] = None



	# For ymmt with trim
	for index, row in df_ymmt.iterrows():
	# for index, row in df_ymmt_bmw.iterrows():
		ymmtid = row["ymmtId"]
		year = row["year"]
		df_trims.loc[df_trims["options_string"].str.contains(rf"\b{year}\b") == True, "year"] =  year
		make = row["make"]
		make_id = row["make_id"]
		df_trims.loc[df_trims["options_string"].str.contains(rf"\b{make}\b") == True, "make"] =  make
		df_trims.loc[df_trims["options_string"].str.contains(rf"\b{make}\b") == True, "make_id"] =  make_id
				
		model = row["model"]
		model_id = row["model_id"]
		df_trims.loc[(df_trims["year"] == year) 
				& (df_trims["make"] == make) 
				& (df_trims["options_string"].str.contains(rf"\b{model}\b") == True), "model"] =  model
		df_trims.loc[(df_trims["year"] == year) 
				& (df_trims["make"] == make) 
				& (df_trims["options_string"].str.contains(rf"\b{model}\b") == True), "model_id"] =  model_id			

		
		tr = str(row["trim"])
		# cleaning trims starting with metacharachters +,?,$ ....
		if not re.match(r"[\W.]",tr):
			trim = row["trim"]
			trim_id = row["trim_id"]	

		df_trims.loc[(df_trims["year"] == year) 
			& (df_trims["make"] == make)
			& (df_trims["model"] == model)
			& (df_trims["options_string"].str.contains(rf"\b{trim}\b") == True), "trim"] =  trim
		df_trims.loc[(df_trims["year"] == year) 
			& (df_trims["make"] == make)
			& (df_trims["model"] == model)
			& (df_trims["options_string"].str.contains(rf"\b{trim}\b") == True), "trim_id"] =  trim_id
		
		
	
	# Merging Reviews(descriptions) data with ymmt data from cosmos
	df_trims_description = df_ymmt.merge(df_trims, how="left", on=["year","make_id","model_id","trim_id"])
	
	##=== Updating documents with new additional filed; "Description"

	# Filtering unmatched Description's rows from DataFrame
	df_trims_desc_filtered = df_trims_description.dropna()


	# for index, doc in enumerate(ymmt_data):
	# 	ymmt_id = doc["ymmtId"]
	# 	try:
	# 		desc = df_trims_desc_filtered['Option_Description'].where(
	# 							df_trims_desc_filtered['ymmtId'] == '{0}'.format(ymmt_id)).dropna().values[0]	
	# 	except: 
	# 		print('index {0} is out of bounds for axis 0 with size 0'.format(index))

	# 	item_response = container.read_item(item=doc["ymmtId"], partition_key=doc["/ymmtId"])
	# 	item_response['description']= desc  
	# 	# response =container.replace_item(item=doc["ymmtId"],body=item_response)   
	# 	# request_charge = container.client_connection.last_response_headers['x-ms-request-charge']
	# 	# print('Read item with id {0}. Operation consumed {1} request units'.format(item_response['id'], (request_charge)))

	# 	# doc["description"]=desc
	# 	print(ymmt_id)
	# 	print(item_response)


	# desc = df_trims_desc_filtered['Option_Description'].where(
	# 							df_trims_desc_filtered['ymmtId'] == '{0}'.format(ymmt_id)).dropna().values[0]

	'''
	## to make a data set of selected documents to add description
	# df_desc_selected = df_trims_desc_filtered['Option_Description'].where(
	# 							df_trims_desc_filtered['ymmtId'] in []).dropna()
	'''
	'''
		samples = {
			"ymmtId":["2017-00000897-00037094-00335863","2016-00000507-00015028-00331026"],
			"Option_Description":["The 2017 Genesis G80 3.8 Sedan offers a Rear Bumper Appliqué. The rear bumper applique provides a freshness to the rear of the car. It is a self-adhesive vinyl film that fits over the top of the rear bumper. It hides blemishes due to scratches and scrapes that may arise from loading and unloading items from the trunk area. It is UV-resistant to defend against the damaging rays of the sun, which may dull the bumper’s finish.",
			"The 2016 Smart Fortwo Passion Hatchback highlights a 6-speed automatic dual-clutch. The 6-speed dual-clutch automatic transmission may increase fuel efficiency by as much 10% compared to the 5-speed standard transmission. The 2016 Smart Fortwo Passion Hatchback was specifically designed with fuel efficiency as the main priority. The dual-clutch operational concept allows the vehicle's transmission to work more as a manual than as an automatic."
			]		

		}
		df_trims_desc_filtered = pd.DataFrame(samples)
	'''
	for index, row in df_trims_desc_filtered.iterrows():
		ymmt_id = row["ymmtId"]
		desc = row["Option_Description"]

		query = ''' SELECT * FROM c WHERE c.ymmtId = '%s' ''' % ymmt_id
    
		item_response = list(container.query_items(
    	query=query,
    	enable_cross_partition_query=True
    	) )

		# item_response = container.read_item(item=ymmt_id, partition_key="ymmtId")
		item_response = item_response[0]
		item_response['description']= desc
		# response =container.replace_item(item=doc["ymmtId"],body=item_response)   
		# request_charge = container.client_connection.last_response_headers['x-ms-request-charge']
		# print('Read item with id {0}. Operation consumed {1} request units'.format(item_response['id'], (request_charge)))
		print(item_response)


	##=== Write to flat files ===	
	# df_trims_description.to_csv("/Users/NTavakol/carv_document_Nasim/AC_Editorial/reviews_ymmt_merged_finall.csv")	
	# df_trims.to_csv("/Users/NTavakol/carv_document_Nasim/AC_Editorial/df_trims_with_ymmt_Id_generated.csv")
	# df_trims.to_csv("/Users/NTavakol/carv_document_Nasim/AC_Editorial/df_trims_bmw_test.csv")	


	# print(df_trims_desc_filtered.head())



if __name__ == '__main__':
	main()




