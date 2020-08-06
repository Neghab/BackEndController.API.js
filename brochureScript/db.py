import pyodbc
import json
import collections
import ast
import datetime


def datetime_converter(o):
  if isinstance(o, datetime.datetime):
      return o.__str__()


def fetchDBEntries():
  print('Creating connection')
  cnx = pyodbc.connect(
    server="vehiclemarket-l.ad.carvana.com",
    database="VehicleMarketDM",
    user='svc-algorithmic',
    tds_version='7.3',
    password="mq15O*P5s)$q76",
    port=1433,
    driver='FreeTDS'
  )
  
  crsr = cnx.cursor()
  print('Cursor created')
  
  print('Querying the DB')
  json_rows = []
  rows = crsr.execute("SELECT * "
                      "FROM [VehicleMarketDM].[dbo].[ymm_brochure] "
                      "where (year >= 2012 and model IS NOT NUll) "
                      "order by year asc").fetchall()
  json_rows = [dict(zip([key[0] for key in crsr.description], row)) for row in rows]
  
  # print(rows)
  print('Cursor closed')
  crsr.close()
  print('Closing the connection')
  cnx.close()
  
  items = json.loads(json.dumps({ "items": json_rows }, default=datetime_converter))
  return  items