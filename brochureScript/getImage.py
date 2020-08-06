#Grab the first page of a pdf, and save as a jpg image
from PIL import Image, ImageDraw
from PIL import Image, ImageFilter
from PIL import ImageFont
from collections import OrderedDict
import urllib.request, json
import textwrap
import img2pdf
import PyPDF2 
import os
from pdf2image import convert_from_path
import sys
import shutil

#Initial Setup
# creating a pdf file object and grabbing the first page to turn into image
def thumbnail_create(input_name, output_name, image_name):
  pdfFileObj = open(input_name, 'rb')
  # creating a pdf reader object 
  try:
    pdfReader = PyPDF2.PdfFileReader(pdfFileObj) 
    pdfWriter = PyPDF2.PdfFileWriter()
    # creating a page object from the first page
    pageObj = pdfReader.getPage(0)
    pdfWriter.addPage(pageObj)
    newFile = open(output_name, 'wb')
    pdfWriter.write(newFile) 
    # closing the pdf file object 
    pdfFileObj.close() 
    newFile.close() 
    #Create the first page as a thumbnail
    pages = convert_from_path(output_name, 500)
    
    # Used if we needed to noramlize the pdf filename and copy it
    # shutil.copy2(input_name, f'assets/brochures/pdfs/{image_name}.pdf')
    
    for page in pages:
      
      thumbPath = f'assets/brochures/thumbnails/{image_name}.jpg'
      page.save(thumbPath, 'JPEG')
      
      thumb = Image.open(thumbPath)
      
      thumb.thumbnail((780, 780))
      thumb.save(thumbPath)
      
      #Remove temp PDF
      os.remove(output_name)
  except:
    fileName = input_name.split('/').pop()
    logName = f'{fileName.replace(".pdf", "")}-error.txt'
    log = open(logName, "w")
    error = sys.exc_info()[0]
    
    if os.path.exists(output_name):
      #Remove temp PDF
      os.remove(output_name)
    
    os.replace(input_name, f'./corrupted-pdfs/{fileName}')
    log.write(f'{error}')
    log.close()
    
    os.replace(f'{os.getcwd()}/{logName}', f'./corrupted-pdfs/{logName}')