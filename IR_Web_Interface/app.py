from flask import Flask, render_template, request, jsonify
from newsapi import NewsApiClient
from spellchecker import SpellChecker
import pysolr

newsapi = NewsApiClient(api_key='195757709c594f629748a8c741366389')
spell = SpellChecker()

app = Flask(__name__)
solr = pysolr.Solr('http://localhost:8983/solr/indexes6')


@app.route('/')
def index():
    return render_template('front.html')

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('query')
    try:
        query = correct_spellings(query)  # Correct spelling
    except:
        print("Could not find corrected spelling for: ", query)

    year = request.args.get('year')
    creator = request.args.get('creator')
    language = request.args.get('language')

    # Perform the search and retrieve the results
    results = perform_solr_search(query, language, year, creator)

    return jsonify(results)

# For autocomplete    
@app.route('/autocomplete')
def autocomplete():
  term = request.args.get('term', '')
  lang = request.args.get('language', '')
  suggestions = get_autocomplete_suggestions(term,lang)
  return jsonify(suggestions)

# For autocomplete
def get_autocomplete_suggestions(query, language, year = None, creator = None):
  print("In: get_autocomplete_suggestions")
  print("Lang: ", language)
  results = perform_solr_search(query, language, year, creator)
  print()
  print(f'Extracted results: {results}')
  print()

  # Extract a list of titles from the results
  titles = [result['title'] for result in results if 'title' in result]
  print("titles: ", titles)

  listOfTitles = list(set([title.strip(' \n\t') for title in titles if title.strip(' \n\t').lower().startswith(query.lower())]))

  print("titles list: ", listOfTitles)

  # Return the unique titles that match the user's input
  return listOfTitles

def correct_spellings(query):
    query_words = query.split()
    corrected_words = []
    for word in query_words:
        corrected_word = spell.correction(word)
        corrected_words.append(corrected_word)
    corrected_query = ' '.join(corrected_words)
    return corrected_query

#solr search   
def perform_solr_search(query, language, year = None, creator = None):

    solr_query = {
        'q': query,
        'defType': 'edismax',
        'qf': 'description^2 title ',
        'pf': 'title^2 description',
        'fl': '*,score',
        'hl': 'true',
        'hl.fl': 'title,description',
        'rows': 20
    }
    print("QUERY PARAMS: ",solr_query)

    if language:
        solr_query['fq'] = 'language:{}'.format(language)

    if year:
        solr_query['fq'] += ' AND date:{}'.format(year)

    if creator:
        solr_query['fq'] += ' AND creator:{}'.format(creator)


    results = solr.search(**solr_query) 

    extracted_results = []
    for result in results:
        extracted_result = {
            'title': result['title'][0] if 'title' in result else 'No title',
            'identifier': result['identifier'][0] if 'identifier' in result else 'No identifier',
            'description': result['description'][0] if 'description' in result else '',
            'creator': result['creator'][0] if 'creator' in result else 'No creator',
            'date': result['date'][0] if 'date' in result else 'No date',
            'score': result['score']

        }

        # Check if highlighting exists for the title and description fields
        if 'highlighting' in result:
            highlighting = result['highlighting']
            if 'title' in highlighting:
                extracted_result['title'] = highlighting['title'][0]
            if 'description' in highlighting:
                extracted_result['description'] = highlighting['description'][0]

        extracted_results.append(extracted_result)
    extracted_results.sort(key=lambda x: x['score'], reverse=True)

    return extracted_results

if __name__ == '__main__':
    app.run()

