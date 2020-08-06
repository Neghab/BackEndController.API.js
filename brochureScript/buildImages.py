#!/usr/bin/python3

import sys
import getopt
import os
import getImage
import datetime
import json
import db


def main():
  brochures = db.fetchDBEntries()['items']
    
  for root, dirs, files in os.walk("./brochures/cdn.dealereprocess.org/cdn/brochures"):
    path = root.split(os.sep)
    
    make = os.path.basename(root)
    
    print((len(path) - 1) * '---', os.path.basename(root))
    
    for file in files:
      if file.endswith('.pdf'):
        
        pdfPath = f'{make}/{file}'
        print(len(path) * '---', f'{"/".join(path)}/{file}')
        
        
        matches = list(filter(lambda b: b["brochure_path"] == pdfPath, brochures))
        
        if len(matches) > 0:
          match = matches[0]
        
          print(match)
          year =  match['year']
          make = match['make']
          model = match["model"]
        
          getImage.thumbnail_create(f'{"/".join(path)}/{file}', f'{"/".join(path)}/temp-{file}', f'{year}-{make}-{model}'.replace(' ', '-'))
        
if __name__ == "__main__":
  main()