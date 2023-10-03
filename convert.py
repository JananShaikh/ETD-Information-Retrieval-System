import xml.etree.ElementTree as et
from bs4 import BeautifulSoup
import sys 
import os

# Function to convert files into correct format
def transformToSolarXML(data,filename):

    # Create a BeautifulSoup object with our original file
    original_data = BeautifulSoup(data, 'xml')

    # Create a BeautifulSoup object to be used for our conversion output
    solr_data = BeautifulSoup(features='xml')
    root = solr_data.new_tag('add')

    # find all records
    records = original_data.find_all('record')

    # process the records
    for record in records:

        title = record.find('dc:title') 
        creator = record.find('dc:creator')
        description =  record.find('dc:description')
        publisher = record.find('dc:publisher')
        date = record.find('dc:date')
        identifier = record.find('dc:identifier')
        language = record.find('dc:language')

        # create a map of the attributes (use None if they dont appear in the record)
        newRecord = {}
        newRecord['title'] = None if title is None else title.text
        newRecord['creator'] = None if creator is None else creator.text
        newRecord['description'] =  None if description is None else description.text
        newRecord['publisher'] = None if publisher is None else publisher.text
        newRecord['date'] = None if date is None else date.text
        newRecord['identifier'] = None if identifier is None else identifier.text
        newRecord['language'] = None if language is None else language.text

        # Create a new doc element
        doc = solr_data.new_tag('doc')
        
        # Add all the keys if they are not None aka if they appeared in the original record
        for key in newRecord.keys():
            if newRecord[key] is not None:
                field = solr_data.new_tag('field',attrs={'name': key})
                field.string = newRecord[key]
                doc.append(field)
        # Append the doc to the converted output object
        root.append(doc)
    solr_data.append(root)

    # Prettify it ot make it more readable 
    xml_output = solr_data.prettify()

    # Write it to a file
    with open('converted6/'+filename[:-4]+'_out.xml', 'w') as file:
        file.write(xml_output)



# We want to run the above funtion for all of the documents in the folder

directory = '/Users/kristenbasson/Documents/UCT/block_2/IR/Ass2/data'  # Replace with the path to your directory

# Iterate over all files in the directory
for filename in os.listdir(directory):
    if os.path.isfile(os.path.join(directory, filename)):
        file_path = os.path.join(directory, filename)
        # Open the file
        with open(file_path, 'r') as file:
            data = file.read()
            transformToSolarXML(data,filename)
            
