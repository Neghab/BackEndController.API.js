# Download and build brochure images

## Dependencies
- first run `brew update`
- wget `brew install wget`
- Poppler `brew install poppler`
- `brew install unixodbc freetds`
- run `pip install -r requirements.txt`

## Fetch all the brochures from the CDN
- Activate your virtualenv `source env/bin/activate`
- Scrape the cdn for pdfs `wget -mk https://cdn.dealereprocess.org/cdn/brochures/`
- Build the thumbnails `python3 buildImages.py`
- Move `assets` to `Cavana.Assets` repo

## Get MSSQL working on your MacOS
https://github.com/mkleehammer/pyodbc/wiki/Connecting-to-SQL-Server-from-Mac-OSX