import pandas as pd
import re
# import json
import numpy as np
from azure.cosmos import exceptions, CosmosClient, PartitionKey
from pandas.core.dtypes.missing import isnull
import pprint

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

	query = ''' SELECT DISTINCT c.ymmtId, 
						c.make, c.make_id,
						c.model,c.model_id,
						c.year,c.year_id,
						c.trim,c.trim_id,
						c.valueAddOptions  
				FROM c '''
    
	items = list(container.query_items(
    	query=query,
    	enable_cross_partition_query=True
    	) )
	return items

def cosmos_data_options_test():
	container = cosmos_connection()

	query = ''' SELECT DISTINCT c.ymmtId, 
						c.make, c.make_id,
						c.model,c.model_id,
						c.year,c.year_id,
						c.trim,c.trim_id, c.valueAddOptions 
				FROM c 
				WHERE c.ymmtId IN ('2017-00000897-00037094-00335863',
								'2016-00000507-00015028-00331026',
								'2016-00000045-00000272-00329075',
								'2020-00000026-00000175'
								
								)'''

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

def filter_none_valueAddOptions(data):
	ymmt_valueAddOptions = []
	for item in data:
		if "valueAddOptions" in item.keys():
			ymmt_valueAddOptions.append(item)
	return ymmt_valueAddOptions


def string_cleaning(string):
	opt_str = None
	lc = []
	if string.find("|") > -1:
		for i,c in enumerate(string):
			if c=="|":
				lc.insert(0,i)
				pos = lc[0]+1
				opt_str = string[pos:]
	else:
		opt_str = string
	
	return opt_str

def data_flattening(response):
	rows=[]
	for data in response:
		data_row = data["valueAddOptions"]	
		ymmt_id = data["ymmtId"]
		make = data["make"]		
		make_id = data["make_id"]
		model = data["model"]
		model_id = data["model_id"]
		year = data["year"]
		try:
			trim = data["trim"]
		except:
			print("N/A Trim")
		try:
			trim_id = data["trim_id"]
		except:
			print("N/A Trim_Id")
		for row in data_row:
			row["ymmtId"] = ymmt_id
			row["make"] = make
			row["make_id"] = make_id
			row["model"] = model
			row["model_id"] = model_id
			row["year"] = year
			
			try:
				row["trim"] = trim
			except:
				print("N/A Trim")
			try:	
				row["trim_id"] = trim_id			
			except:
				print("N/A Trim_Id")

			rows.append(row)
		
	return rows 

def main():
	container = cosmos_connection()
	ymmt_data = cosmos_data()
	# ymmt_data = cosmos_data_options_test()
	ymmt_valueAddOptions = filter_none_valueAddOptions(ymmt_data)
	ymmt_data_flat = data_flattening(ymmt_valueAddOptions)
	df_ymmt = pd.DataFrame(ymmt_data_flat)
	
	csv_file = "/Users/NTavakol/carv_document_Nasim/AC_Editorial/Final_Trim Spreadsheet_Sheet1.csv"
	path = "/Users/NTavakol/carv_document_Nasim/AC_Editorial/"
		
	df_trims = pd.read_csv(csv_file, header='infer')
	df_trims.rename(columns={"ID_1": "ID", "ID_2": "options_string"}, inplace=True)
	df_trims["option_string_cln"] = df_trims["options_string"].apply(string_cleaning)
	df_trims["trim"] = None
	# print(df_trims)

	for index, row in df_ymmt.iterrows():
	# for index, row in df_ymmt_bmw.iterrows():
		ymmtid = row["ymmtId"]
		year = row["year"]
		df_trims.loc[df_trims["option_string_cln"].str.contains(rf"\b{year}\b") == True, "year"] =  year
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

		## Extracting trims from option_string to add trim_id
		## Trim_names should be in String format
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

##==============================================
	
	##== Extracting Option_id in add_value_option from option_string to option_id to editorial content
	df_ymmt.loc[df_ymmt["trim"].isna(), 'flg'] = False
	df_ymmt.loc[df_ymmt["trim"].notna(), 'flg'] = True

	## adding starting position(string index) of option_name in options_string to the DataFrame   
	for index, row in df_ymmt.iterrows():
		year = row["year"]
		make = row["make"]
		model = row["model"]
		trim = row["trim"]
		if row['flg']:
			option_name = row["option_name"]
			option_id = row["option_id"]
			trim_len = len(trim) 
			## preparin substring after trim name to lookup option_name
			df_trims.loc[(df_trims["year"] == year) 
				& (df_trims["make"] == make)
				& (df_trims["model"] == model)
				& (df_trims["trim"] == trim),  "trim_pos"] = df_trims["option_string_cln"].str.find(trim) + len(trim) + 1
			
		else:
			try:
				df_trims.loc[(df_trims["year"] == year) 
					& (df_trims["make"] == make)
					& (df_trims["model"] == model), "trim_pos"] = df_trims["option_string_cln"].str.find(trim) + len(trim) + 1
			except:
				print("N/A model")	
	df_trims.loc[df_trims["trim_pos"].isna(), "trim_pos"] = -1
	df_trims["option_pos_int"] = df_trims["trim_pos"].astype(int)

	# preparing Option's substring to avoid conflict between trim_name and options_name while extracting option's 
	for index, row in df_trims.iterrows():
		if row["option_pos_int"] > -1:
			option_pos_int = row["option_pos_int"]
			df_trims["option_substring"] = df_trims["option_string_cln"].str[option_pos_int:]

	# Extracting options_name from option_substring
	for index, row in df_ymmt.iterrows():
		year = row["year"]
		make = row["make"]
		model = row["model"]
		trim = row["trim"]
		option_name = row["option_name"]
		option_id = row["option_id"]
		# print(make," ,",option_name)
		if row['flg']:
			df_trims.loc[(df_trims["year"] == year) 
				& (df_trims["make"] == make)
				& (df_trims["model"] == model)
				& (df_trims["trim"] == trim)
				& (df_trims["option_substring"].str.contains(rf"\b{option_name}\b") == True), "option_name"] =  option_name
			df_trims.loc[(df_trims["year"] == year) 
				& (df_trims["make"] == make)
				& (df_trims["model"] == model)
				& (df_trims["trim"] == trim)
				& (df_trims["option_substring"].str.contains(rf"\b{option_name}\b") == True), "option_id"] = option_id
		else:
			
			df_trims.loc[(df_trims["year"] == year) 
				& (df_trims["make"] == make)
				& (df_trims["model"] == model)
				& (df_trims["option_substring"].str.contains(rf"\b{option_name}\b") == True), "option_name"] =  option_name
			df_trims.loc[(df_trims["year"] == year) 
				& (df_trims["make"] == make)
				& (df_trims["model"] == model)
				& (df_trims["option_substring"].str.contains(rf"\b{option_name}\b") == True), "option_id"] = option_id
			
	# print(df_trims)	

	## Filtering to reviews for year 2011 which is available in 	
	df_trims = df_trims.where(~df_trims["ID"].isin([21779868,21780036]))
	df_trims.dropna()

	# Merging Reviews(descriptions) data with ymmt data from cosmos
	df_trims_description = df_ymmt.merge(df_trims, how="left", on=["year","make_id","model_id","trim_id","option_id"])

	## Filtering unmatched Description's rows from DataFrame
	df_trims_desc_filtered = df_trims_description.dropna()
	# print(df_trims_desc_filtered)
	
	##=== Updating documents with new additional filed; "Description"
	# for index, row in df_desc_selected.iterrows():
	for index, row in df_trims_desc_filtered.iterrows():	
		ymmt_id = row["ymmtId"]
		desc = row["Option_Description"]

		query = ''' SELECT * FROM c WHERE c.ymmtId = '%s' ''' % ymmt_id
    
		item_response = list(container.query_items(
    	query=query,
    	enable_cross_partition_query=True
    	) )

		# item_response = container.read_item(item=row["ymmtId"], partition_key="ymmtId")
		# item_response = item_response[0]
		# item_response['description']= desc

	## Replacing cosmos document with item_response which includes oprtions_description
	# 	# response =container.replace_item(item=row["ymmtId"],body=item_response)   
	# 	# request_charge = container.client_connection.last_response_headers['x-ms-request-charge']
	# 	# print('Read item with id {0}. Operation consumed {1} request units'.format(item_response['id'], (request_charge)))
	# 	# print(row["ymmtId"])
	# 	# pprint.pprint(item_response)


	##=== Write to flat files ===	
	
	df_trims.to_csv("/Users/NTavakol/carv_document_Nasim/AC_Editorial/df_trim_samples.csv")
	df_trims_desc_filtered.to_csv("/Users/NTavakol/carv_document_Nasim/AC_Editorial/cosmos_data_with_descriptions_samples.csv")


	# print(item_response)
	# pprint.pprint(item_response)

if __name__ == '__main__':
	main()




