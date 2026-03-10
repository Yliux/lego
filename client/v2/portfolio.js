// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

// --- SELECTEURS ---
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals = document.querySelector('#deals');
const sectionSales = document.querySelector('#sales');
const selectSort = document.querySelector('#sort-select');

// Filtres
const filterBestDiscount = document.querySelector('#filters span:nth-child(1)');
const filterMostCommented = document.querySelector('#filters span:nth-child(2)');
const filterHotDeals = document.querySelector('#filters span:nth-child(3)');
const filterFavoritesBtn = document.querySelector('#filters span:nth-child(4)'); // FEATURE 14

// Indicateurs (modifiés pour utiliser des IDs clairs)
const spanNbDeals = document.querySelector('#nbDeals');
const spanNbSales = document.querySelector('#nbSales');
const spanAverage = document.querySelector('#averageSales');
const spanP5 = document.querySelector('#p5Value');
const spanP25 = document.querySelector('#p25Value');
const spanP50 = document.querySelector('#p50Value');
const spanLifetime = document.querySelector('#lifetimeValue'); // FEATURE 10

// --- VARIABLES GLOBALES ---
let currentDeals = [];
let currentPagination = {};

// FEATURE 13 : Récupérer les favoris depuis le stockage du navigateur
let favoriteIds = JSON.parse(localStorage.getItem('lego-favorites')) || [];

/**
 * Set global value
 */
const setCurrentDeals = ({ result, meta }) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return { currentDeals, currentPagination };
    }
    return body.data;
  } catch (error) {
    console.error(error);
    return { currentDeals, currentPagination };
  }
};

/**
 * Fetch sales from api (Feature 7)
 */
const fetchSales = async (id) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/sales?id=${id}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error("Erreur API Sales:", body);
      return [];
    }
    return body.data?.result || body.result || [];
  } catch (error) {
    console.error("Erreur Fetch Sales:", error);
    return [];
  }
};

/**
 * Calculate Percentile (Feature 9)
 */
const calculatePercentile = (arr, p) => {
  if (arr.length === 0) return 0;
  const index = Math.ceil((p / 100) * arr.length) - 1;
  return arr[index];
};

/**
 * Render list of deals
 */
const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  div.className = 'cards-grid'; // FEATURE 15
  
  const template = deals
    .map(deal => {
      // Vérifier si le deal est dans les favoris
      const isFav = favoriteIds.includes(deal.uuid);
      
      return `
      <div class="deal-card" id=${deal.uuid}>
        <span class="id-badge">ID: ${deal.id}</span>
        <span class="fav-btn" data-uuid="${deal.uuid}">${isFav ? '❤️' : '🤍'}</span>
        
        <a href="${deal.link}" target="_blank">${deal.title}</a>
        <span class="price">${deal.price} €</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
};

/**
 * Render list of sales
 */
const renderSales = sales => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  div.className = 'cards-grid'; // FEATURE 15
  
  const template = sales
    .map(sale => {
      return `
      <div class="sale-card" id=${sale.uuid}>
        <a href="${sale.link}" target="_blank">${sale.title}</a>
        <span class="price">${sale.price} €</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionSales.innerHTML = '<h2>Sales</h2>';
  sectionSales.appendChild(fragment);
};

/**
 * Render page selector
 */
const renderPagination = pagination => {
  const { currentPage, pageCount } = pagination;
  const options = Array.from(
    { 'length': pageCount },
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 */
const renderLegoSetIds = deals => {
  const ids = deals.map(deal => deal.id);
  const uniqueIds = [...new Set(ids)]; 
  const options = uniqueIds.map(id =>
    `<option value="${id}">${id}</option>`
  ).join('');
  selectLegoSetIds.innerHTML = options;
};

/**
 * Render indicators
 */
const renderIndicators = pagination => {
  const { count } = pagination;
  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals);
};

// --- LISTENERS ---

document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
  const deals = await fetchDeals(parseInt(event.target.value), currentPagination.pageSize);
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

// FEATURE 13 : Gérer le clic sur le bouton Favori (Event Delegation)
sectionDeals.addEventListener('click', (event) => {
  if (event.target.classList.contains('fav-btn')) {
    const uuid = event.target.getAttribute('data-uuid');
    
    // Ajoute ou retire des favoris
    if (favoriteIds.includes(uuid)) {
      favoriteIds = favoriteIds.filter(id => id !== uuid);
      event.target.textContent = '🤍';
    } else {
      favoriteIds.push(uuid);
      event.target.textContent = '❤️';
    }
    
    // Sauvegarde dans le navigateur
    localStorage.setItem('lego-favorites', JSON.stringify(favoriteIds));
  }
});

// FEATURE 14 : Filtrer par Favoris
filterFavoritesBtn.addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => favoriteIds.includes(deal.uuid));
  renderDeals(filteredDeals);
  spanNbDeals.innerHTML = filteredDeals.length;
});

// FILTRES CLASSIQUES
filterBestDiscount.addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => deal.discount > 50);
  renderDeals(filteredDeals);
  spanNbDeals.innerHTML = filteredDeals.length;
});

filterMostCommented.addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => deal.comments > 5);
  renderDeals(filteredDeals);
  spanNbDeals.innerHTML = filteredDeals.length;
});

filterHotDeals.addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => parseInt(deal.temperature) > 100);
  renderDeals(filteredDeals);
  spanNbDeals.innerHTML = filteredDeals.length;
});

// TRI
selectSort.addEventListener('change', (event) => {
  const sortType = event.target.value;
  let sortedDeals = [...currentDeals];

  switch (sortType) {
    case 'price-asc':
      sortedDeals.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      break;
    case 'price-desc':
      sortedDeals.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      break;
    case 'date-asc':
      sortedDeals.sort((a, b) => new Date(b.published) - new Date(a.published));
      break;
    case 'date-desc':
      sortedDeals.sort((a, b) => new Date(a.published) - new Date(b.published));
      break;
  }
  renderDeals(sortedDeals);
  spanNbDeals.innerHTML = sortedDeals.length;
});

// VENTES (SALES) & FEATURE 10 (Lifetime)
selectLegoSetIds.addEventListener('change', async (event) => {
  const legoSetId = event.target.value;

  const specificDeals = currentDeals.filter(deal => deal.id == legoSetId);
  spanNbDeals.innerHTML = specificDeals.length;

  const sales = await fetchSales(legoSetId);
  spanNbSales.textContent = sales.length;

  // Calcul des percentiles
  const prices = sales.map(sale => parseFloat(sale.price)).sort((a, b) => a - b);
  const average = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const p5 = calculatePercentile(prices, 5);
  const p25 = calculatePercentile(prices, 25);
  const p50 = calculatePercentile(prices, 50);

  spanAverage.textContent = average.toFixed(2) + ' €';
  spanP5.textContent = p5 ? p5 + ' €' : '0 €';
  spanP25.textContent = p25 ? p25 + ' €' : '0 €';
  spanP50.textContent = p50 ? p50 + ' €' : '0 €';

  // FEATURE 10 : Calculer le Lifetime Value (Âge maximum des ventes en jours)
  let maxLifetime = 0;
  sales.forEach(sale => {
    if(sale.published) {
      const pubDate = new Date(sale.published);
      if(!isNaN(pubDate.getTime())) {
        const days = (new Date() - pubDate) / (1000 * 3600 * 24); // Différence en jours
        if(days > maxLifetime) maxLifetime = days;
      }
    }
  });
  spanLifetime.textContent = Math.round(maxLifetime) + ' days';

  renderSales(sales);
});