
// Creating custom element
class CustomCard extends HTMLElement {

constructor() {
  super();
  this.attachShadow({ mode: 'open' });
}

connectedCallback() {

// Append the <link> element to the shadow DOM

  // Create the link element and set its attributes

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = "{{ url_for('static', filename='css/styles.css') }}";

  // Append the <link> element to the shadow DOM
  this.shadowRoot.appendChild(link);

  // Get the input parameters from the custom attributes
  const description = this.getAttribute('description');
  const title = this.getAttribute('title');
  const author = this.getAttribute('author');
  const date = this.getAttribute('date');

  // Create the card markup
  this.shadowRoot.innerHTML = `
    <div class="custom-card">
      <h3 class="title">${title}</h3>
      <p class="description">${description}</p>
      <p class="author">By ${author}</p>
      <h4 class="date">${date}</h4>
    </div>
  `;
}
}

// Define the custom element tag name
customElements.define('custom-card', CustomCard);
