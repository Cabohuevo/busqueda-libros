const searchForm = document.getElementById('search-form');
const titleIsbnInput = document.getElementById('title-isbn-input');
const authorInput = document.getElementById('author-input');
const resultsDiv = document.getElementById('results');
const loadMoreBtn = document.getElementById('load-more');

let currentPage = 1;
let currentTitleIsbn = "";
let currentAuthor = "";

// Evento para manejar la búsqueda
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  currentTitleIsbn = titleIsbnInput.value.trim();
  currentAuthor = authorInput.value.trim();

  if (!currentTitleIsbn && !currentAuthor) {
    resultsDiv.innerHTML = '<div class="alert alert-warning">Por favor, ingresa un título/ISBN o un autor para buscar.</div>';
    return;
  }

  currentPage = 1;
  resultsDiv.innerHTML = "";
  loadMoreBtn.classList.add("d-none");

  await fetchResults();
});


loadMoreBtn.addEventListener('click', async () => {
  currentPage++;
  await fetchResults();
});

// Función para obtener y mostrar resultados
async function fetchResults() {
  if (isISBN(currentTitleIsbn)) {

    await fetchByISBN(currentTitleIsbn);
  } else {

    const queryParams = [];
    if (currentTitleIsbn) queryParams.push(`title=${encodeURIComponent(currentTitleIsbn)}`);
    if (currentAuthor) queryParams.push(`author=${encodeURIComponent(currentAuthor)}`);
    
    const url = `https://openlibrary.org/search.json?${queryParams.join("&")}&page=${currentPage}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      displayResults(data.docs);
      if (data.docs.length === 0 || !data.docs.length) {
        loadMoreBtn.classList.add("d-none");
      } else {
        loadMoreBtn.classList.remove("d-none");
      }
    } catch (error) {
      resultsDiv.innerHTML = '<div class="alert alert-danger">Ocurrió un error al buscar. Por favor, intenta de nuevo.</div>';
      console.error(error);
    }
  }
}

//(Se tuvo que usar una direccion diferente de la API ya que no esta soportada en la misma URL que la busqueda por autor o nombre)
async function fetchByISBN(isbn) {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const bookKey = Object.keys(data)[0]; // La respuesta tiene las claves en el formato "ISBN:xxxxx"

    if (bookKey) {
      const book = data[bookKey];
      displayISBNResult(book);
    } else {
      resultsDiv.innerHTML = '<div class="alert alert-warning">No se encontraron libros con ese ISBN.</div>';
    }
  } catch (error) {
    resultsDiv.innerHTML = '<div class="alert alert-danger">Ocurrió un error al buscar por ISBN. Por favor, intenta de nuevo.</div>';
    console.error(error);
  }
}

// Función para mostrar resultados generales
function displayResults(books) {
  if (books.length === 0 && currentPage === 1) {
    resultsDiv.innerHTML = '<div class="alert alert-warning">No se encontraron libros.</div>';
    return;
  }

  books.forEach((book) => {
    const bookElement = document.createElement('div');
    bookElement.classList.add('col-12', 'col-md-6', 'col-lg-4');
    bookElement.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">${book.title}</h5>
          <p class="card-text"><strong>Autor:</strong> ${book.author_name ? book.author_name.join(', ') : 'Desconocido'}</p>
          <p class="card-text"><strong>Año:</strong> ${book.first_publish_year || 'Desconocido'}</p>
          <p class="card-text"><strong>ISBN:</strong> ${book.isbn ? book.isbn[0] : 'No disponible'}</p>
        </div>
      </div>
    `;
    resultsDiv.appendChild(bookElement);
  });
}

// Función para mostrar resultados específicos de ISBN 

function displayISBNResult(book) {
  const bookElement = document.createElement('div');
  bookElement.classList.add('col-12');
  bookElement.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">${book.title}</h5>
        <p class="card-text"><strong>Autor:</strong> ${book.authors ? book.authors.map(a => a.name).join(', ') : 'Desconocido'}</p>
        <p class="card-text"><strong>Año:</strong> ${book.publish_date || 'Desconocido'}</p>
        <p class="card-text"><strong>ISBN:</strong> ${book.identifiers.isbn_13 ? book.identifiers.isbn_13[0] : 'No disponible'}</p>
        <p class="card-text"><strong>Editorial:</strong> ${book.publishers ? book.publishers.map(p => p.name).join(', ') : 'Desconocido'}</p>
      </div>
    </div>
  `;
  resultsDiv.appendChild(bookElement);
}


function isISBN(input) {
  return /^\d{10}(\d{3})?$/.test(input);
}
