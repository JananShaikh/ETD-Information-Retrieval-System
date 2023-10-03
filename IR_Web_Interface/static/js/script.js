const searchForm = document.getElementById('search-form');
const queryInput = document.getElementById('query-input');
const resultsList = document.getElementById('results-list');
const yearInput = document.getElementById('year-input');
const creatorInput = document.getElementById('creator-input');
const sortDropdown = document.querySelector(".dropdown-content");
const languageInput = document.getElementById('language-select');
const microphoneButton = document.createElement('button');
const newsHeadlines = document.getElementById('news-headlines');

searchForm.addEventListener('submit', function(event) {
  console.log("SUBMITTING");
  event.preventDefault(); // Prevent form submission
  const query = queryInput.value;
  const year = yearInput.value;
  const creator = creatorInput.value;
  const language = languageInput.value;

  performSearch(query,language, year,creator);
  performNewsSearch(query)

  buttonsContainer.style.display = 'flex';
});

// Add event listener for Enter key so that microphone doesnt trigger when enter is pressed but that it still searches
document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    // Prevent Enter key from triggering the microphone button
    event.preventDefault();

    // Still perform the search/submit when the enter key is pressed
    const query = queryInput.value;
    const year = yearInput.value;
    const creator = creatorInput.value;
    const language = languageInput.value;

    performSearch(query, language, year, creator);
    performNewsSearch(query)

    buttonsContainer.style.display = 'flex';
  }
});

//Auto Complete
$(function() {
  $('#query-input').autocomplete({
    source: function(request, response) {
      const url = `/autocomplete?term=${encodeURIComponent(request.term)}`+ "&language="+document.getElementById('language-select').value;
      fetch(url)
        .then(response => response.json())
        .then(data => response(data))
        .catch(error => console.error(error));
    },
  });
});

// Drop down menu for all the sorting
sortDropdown.addEventListener("click", function(event) {
  event.preventDefault();
  if (event.target.id === "sort-name") {
    sortResultsByName();
  } else if (event.target.id === "sort-name-desc") {
    sortResultsByNameDesc();
  }

  if (event.target.id === "sort-year") {
    sortResultsByYear();
  } else if (event.target.id === "sort-year-desc") {
    sortResultsByYearDesc();
  }
});

// Add voice-to-text functionality
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'en-UK';

// needs to be set to false for the eventlisteners for microphone to work
let isListening = false;

microphoneButton.innerHTML = '<i class="fas fa-microphone"></i>';
microphoneButton.className = 'microphone-button';
queryInput.parentNode.insertBefore(microphoneButton, queryInput.nextSibling);

//eventlistener for the microphone that if its clicked it listens but if it is already listening and clicked it stops
microphoneButton.addEventListener('click', function(event) {
  if (isListening) {
    recognition.stop();
    isListening = false;
  } else {
    recognition.start();
    isListening = true;
  }
});

// Event listener for microphone recognition end
recognition.addEventListener('end', function() {
  isListening = false;
});


recognition.onresult = function(event) {
  const query = event.results[0][0].transcript;
  queryInput.value = query;

  performSearch(query, language, year, creator);
};

recognition.onerror = function(event) {
  console.error(event);
};

// Perform the search and retrieve the results
function performSearch(query, language, year, creator) {

  let url = `/search?query=${encodeURIComponent(query)}`;

  url += `&language=${encodeURIComponent(language)}`;

  if (year)
  {
      url += `&year=${encodeURIComponent(year)}`;
  }
  
  if (creator)
  {
      url += `&creator=${encodeURIComponent(creator)}`;
  }

  fetch(url)
    .then(response => response.json())
    .then(data => {
      // Clear the previous search results
      resultsList.innerHTML = '';

      // Add the results to the list to display
      displayResults(data);

      // Get references to the buttons
      const searchButton = document.getElementById('searchButton');
      const newsButton = document.getElementById('newsButton');

      // Add click event listeners
      searchButton.addEventListener('click', function () {
        searchButton.classList.add('active');
        newsButton.classList.remove('active');
        document.getElementById('results-container').style.display = 'flex';
        document.getElementById('results-list').style.display = 'flex';
        document.getElementById('news-container').style.display = 'none' //flex

      });

      newsButton.addEventListener('click', function () {
        newsButton.classList.add('active');
        searchButton.classList.remove('active');
        // Toggle the visibility of the search results list
        document.getElementById('results-container').style.display = 'none';
        document.getElementById('results-list').style.display = 'none';
        document.getElementById('news-container').style.display = 'flex'
      });
    })
    .catch(error => console.error(error));
}

function displayResults(results) {
 // Clear the previous search results and count
resultsList.innerHTML = '';

//counter for how many results are returned
const resultsCountElement = document.querySelector('.results-count');
if (resultsCountElement) {
  resultsCountElement.remove();
}

// If the query is empty, return
if (queryInput.value.trim() === '') {
  return;
}

if (results.length != 0) {
  const resultsCount = results.length;
  const resultsHTML = `
    <div id="res-found-header" class="results-count">
      <p>${resultsCount} Result${resultsCount !== 1 ? 's' : ''} Found</p>
    </div>
  `;
  resultsList.insertAdjacentHTML('beforebegin', resultsHTML);

   // Add the results to the list to display
   results.forEach(result => {

    const resultsList = document.getElementById('results-list');

    const fullDate = new Date(result.date.trim());
    const year = fullDate.getFullYear();
    const month = fullDate.getMonth() + 1;
    const day = fullDate.getDate();

    const formattedDate = [year, month, day].join('/');

    let last4 = formattedDate.slice(-4);
    let prettyDate;
    if(last4==='/1/1')
      prettyDate = year;
    else
      prettyDate = formattedDate;

    //shows results with highlight matches to the query
    const itemHTML = `
      <li>
        <h3> <a href="${result.identifier}" target="_blank"> <b>${highlightMatches(result.title, queryInput.value)}</b> </a> </h3>
        <p> <b>Description:</b> ${highlightMatches(result.description, queryInput.value)}</p>
        <p> <b>Creator:</b> ${highlightMatches(result.creator, queryInput.value)}</p> 
        <h4> <b>Date:</b> ${highlightMatches(prettyDate, queryInput.value)}</h4>
      </li>
    `;
  
    // Append the item HTML to the results list
    resultsList.innerHTML += itemHTML;

});
} else {
  const noResultsHTML = `
    <div id="no-res-found-header" class="no-results">
      <p>No Results Found</p>
      <img src="https://media0.giphy.com/media/5QTCH9HcixzA1STEs9/200w.webp?cid=ecf05e47acuqi6yy3kn5y2r4ntemv791f3m0csxarkh2syl7&ep=v1_stickers_search&rid=200w.webp&ct=s" alt="cat_thinking">
    </div>
  `;
  resultsList.innerHTML = noResultsHTML;
}

}

//HIGHLIGHTING QUERY WORDS
function highlightMatches(text, query) {
  // Return the original value if it's not a string
  if (typeof text !== 'string') {
    return text;
  }

  const regex = new RegExp(query, 'gi');
  const highlightedText = text.replace(regex, '<span class="highlight">$&</span>');
  return highlightedText;
}
//SORTING FUNCTIONS
//sorting results by name ascending
function sortResultsByName() {
  const results = Array.from(resultsList.children);
  results.sort((a, b) => a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent));

  // Clear previous search results
  resultsList.innerHTML = '';

  // Add the sorted results to the list
  results.forEach(result => resultsList.appendChild(result));
}

//sorting results by name descending
function sortResultsByNameDesc() {
  const results = Array.from(resultsList.children);
  results.sort((b, a) => a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent));

  // Clear the previous search results
  resultsList.innerHTML = '';

  // Add the sorted results to the list
  results.forEach(result => resultsList.appendChild(result));
}

//Sort by year ascending
function sortResultsByYear() {
  const results = Array.from(resultsList.children);
  results.sort((a, b) => a.querySelector('h4').textContent.localeCompare(b.querySelector('h4').textContent));

  // Clear the previous search results
  resultsList.innerHTML = '';

  results.forEach(result => resultsList.appendChild(result))

}

//Sort by year descending
function sortResultsByYearDesc() {
  // Get the current search results and sort them by date
  const results = Array.from(resultsList.children);
  results.sort((b, a) => a.querySelector('h4').textContent.localeCompare(b.querySelector('h4').textContent));

  // Clear the previous search results
  resultsList.innerHTML = '';

  results.forEach(result => resultsList.appendChild(result))
}

// NEWS 
function performNewsSearchAll(query) {
  console.log("performNewsSearch")
  let newsEndpoint = `https://newsapi.org/v2/everything?sortBy=relevancy&pageSize=20&apiKey=195757709c594f629748a8c741366389`;
  // let newsEndpoint = `https://newsapi.org/v2/top-headlines?country=us&apiKey=195757709c594f629748a8c741366389`;
  
  if (query !== '') {
    newsEndpoint += `&q=${encodeURIComponent(query)}`;
  }

  fetch(newsEndpoint)
    .then(response => response.json())
    .then(data => {
      displayNewsHeadlines(data.articles)
      console.log("results: "+data.articles)
    })
    .catch(error => console.error(error));
}

function performNewsSearch(query) {
  console.log("performNewsSearch \n")
  let newsEndpoint = `https://newsapi.org/v2/top-headlines?sortBy=relevancy&pageSize=20&apiKey=195757709c594f629748a8c741366389`;
  // let newsEndpoint = `https://newsapi.org/v2/top-headlines?country=us&apiKey=195757709c594f629748a8c741366389`;
  console.log("query: "+query +"=========");
  
  if (query !== '') {
    newsEndpoint += `&q=${encodeURIComponent(query)}`;
  }

  fetch(newsEndpoint)
    .then(response => response.json())
    .then(data => {
      console.log("DATA: "+data)
      console.log("DATA.ARTICLES: "+data.articles)
      displayNewsHeadlines(data.articles)
      console.log("results: "+data.articles)
      if(data.totalResults==0)
        performNewsSearchAll(query)
    })
    .catch(error => console.error(error));
}

function displayNewsHeadlines(articles) {
  newsHeadlines.innerHTML = '';

  articles.forEach(article => {
    const headline = document.createElement('li');
    const headlineLink = document.createElement('a');
    headlineLink.textContent = article.title;
    headlineLink.href = article.url;
    headlineLink.target = '_blank';
    headline.appendChild(headlineLink);
    newsHeadlines.appendChild(headline);
  });
}