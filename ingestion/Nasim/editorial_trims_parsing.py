'''
import pandas as pd
import re

def main():

    with open("/Users/NTavakol/carv_document_Nasim/AC_Editorial/Final_Trim Spreadsheet_Sheet1.csv", "r") as data:
        df_trims = pd.DataFrame(data)
# df[df['Country (region)'].str.match('^P.*')== True]
    print(df_trims)
'''
import pandas as pd
import re
import json
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
	ymmt_data = cosmos_data()
	df_ymmt = pd.DataFrame(ymmt_data)
	# print(df_ymmt.query(str(df_ymmt["ymmtId"]) == "2020-00000897-00037094"))
	

	# print(df_ymmt.loc[df_ymmt["trim"].isna()])
	df_NoTrim = df_ymmt.loc[df_ymmt["trim"].isna()]
	df_WithTrim =df_ymmt.loc[df_ymmt["trim"].notna()]

	makes = makes_data()	
	csv_file = "/Users/NTavakol/carv_document_Nasim/AC_Editorial/Final_Trim Spreadsheet_Sheet1.csv"
	path = "/Users/NTavakol/carv_document_Nasim/AC_Editorial/"
	
	# with open(path + "makes.json",) as f:
	# 	makes = json.load(f)
	
	df_trims = pd.read_csv(csv_file, header='infer')
	df_trims.rename(columns={"ID_1": "ID", "ID_2": "options_string"}, inplace=True)
	df_trims["trim"] = None
##================================ Drafts===========================	
	# df_trims[df_trims['options_string'].str.match('Volkswagen')== True, 'Volkswagen']
    # df_trims["makes"] = ["Volkswagen" if df_trims['options_string'].str.match('Volkswagen')== True]

    #Converting options_string data type to string
    # df_trims.astype({"options_string":"varchar"})
    # df_trims.filter(like="Volkswagen",axis="options_string")

	# df_trims.loc[df_trims["options_string"].str.contains(r"\bBMW\b") == True, "make"] =  "BMW"
	# df_trims.loc[df_trims["options_string"].str.contains(r"\b7 Series\b") == True, "model"] =  "7 Series"
	# df_trims.loc[df_trims["options_string"].str.contains(r"\b760Li Sedan 4D\b") == True, "trim"] =  "760Li Sedan 4D"

	# for trim in ["SLE Pickup 4D","SX Turbo Sport Utility 4D","LX Sport Utility 4D","EX Sport Utility 4D]"]:
	# for trim in ["1.4T R-Line Sedan 4D","+ Wagon 4D","#PinkBeetle Hatchback 2D","! Wagon 4D","#PinkBeetle Convertible 2D"]:

	#"{:08d}".format(897)
##=================================================================
	# l_ymmtids = ["2016-00000005-00032913-00330793",
	# 	"2016-00000005-00032913-00330800",
	# 	"2016-00000005-00032913-00330791",
	# 	"2016-00000005-00032913-00330781",
	# 	"2016-00000005-00032913-00330792",
	# 	"2016-00000005-00032913-00330787",
	# 	"2016-00000005-00032913-00330812",
	# 	"2016-00000005-00032913-00330798"]

	# df_ymmt_bmw = df_ymmt[df_ymmt["ymmtId"].isin( l_ymmtids	)]
	
    
	# trim_ids = [21819090,21819096,21819088,21819092,21819094]
	# df_trims = df_trims[df_trims["ID"].isin(trim_ids)]

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
		
		# df_trims.loc[df_trims["options_string"].str.contains(rf"\b{year}\b") == True, "year"] =  year
		# df_trims.loc[df_trims["options_string"].str.contains(rf"\b{make}\b") == True, "make"] =  make
		# df_trims.loc[df_trims["options_string"].str.contains(rf"\b{model}\b") == True, "model"] =  model
		# df_trims.loc[df_trims["options_string"].str.contains(rf"\b{trim}\b") == True, "trim"] =  trim

		# df_trims.loc[df_trims["options_string"].str.contains(rf"\b{make}\b") == True, "make_id"] =  make_id #"{:08d}".format(make_id)
		# df_trims.loc[df_trims["options_string"].str.contains(rf"\b{model}\b") == True, "model_id"] =  model_id #"{:08d}".format(model_id)
		# if pd.notnull(row["trim"]):
		# 	df_trims.loc[df_trims["options_string"].str.contains(rf"\b{trim}\b") == True, "trim_id"] =  trim_id #"{:08d}".format(int(trim_id))
		# 	print(row["trim"])
	
	
	# Creating ymmtId for Trim Review data	
	# df_trims["ymmtId"]=(df_trims["year"]+"-"+df_trims["make_id"]+"-"+df_trims["model_id"]+"-"+df_trims["trim_id"])	
	
	# Merging Reviews(descriptions) data with ymmt data from cosmos
	df_trims_description = df_ymmt.merge(df_trims, how="left", on=["year","make_id","model_id","trim_id"])
	
	# df_trims.to_csv("/Users/NTavakol/carv_document_Nasim/AC_Editorial/df_trims_with_ymmt_Id_generated.csv")
	df_trims_description.to_csv("/Users/NTavakol/carv_document_Nasim/AC_Editorial/reviews_ymmt_merged_finall.csv")	
	# df_trims.to_csv("/Users/NTavakol/carv_document_Nasim/AC_Editorial/df_trims_bmw_test.csv")	
	print(df_trims)



if __name__ == '__main__':
	main()




