'use strict';

// --- SELECTEURS ---
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals = document.querySelector('#deals');
const sectionSales = document.querySelector('#sales');
const selectSort = document.querySelector('#sort-select');

const filterBestDiscount = document.querySelector('#filters span:nth-child(1)');
const filterMostCommented = document.querySelector('#filters span:nth-child(2)');
const filterHotDeals = document.querySelector('#filters span:nth-child(3)');
const filterFavoritesBtn = document.querySelector('#filters span:nth-child(4)'); 

const spanNbDeals = document.querySelector('#nbDeals');
const spanNbSales = document.querySelector('#nbSales');
const spanAverage = document.querySelector('#averageSales');
const spanP5 = document.querySelector('#p5Value');
const spanP25 = document.querySelector('#p25Value');
const spanP50 = document.querySelector('#p50Value');
const spanLifetime = document.querySelector('#lifetimeValue'); 

// --- VARIABLES GLOBALES ---
let currentDeals = [];
let currentPagination = {};
let favoriteIds = JSON.parse(localStorage.getItem('lego-favorites')) || [];

// --- TA VRAIE URL VERCEL ---
const BASE_URL = "https://server-eight-silk-15.vercel.app";

/**
 * Set global value
 */
const setCurrentDeals = (data) => {
  // Adaptation au format de ton API (results, total, limit)
  currentDeals = data.results || [];
  currentPagination = {
    count: data.total || currentDeals.length,
    pageSize: data.limit || 12,
    currentPage: 1,
    pageCount: Math.ceil((data.total || 1) / (data.limit || 12))
  };
};

/**
 * Fetch deals from api
 */
const fetchDeals = async (page = 1, size = 12) => {
  try {
    // Utilisation de TA route /deals/search
    const response = await fetch(`${BASE_URL}/deals/search?limit=${size}`);
    const body = await response.json();
    return body; // Renvoie directement l'objet {limit, total, results}
  } catch (error) {
    console.error("Erreur Fetch Deals:", error);
    return { results: [], total: 0 };
  }
};

/**
 * Fetch sales from api
 */
const fetchSales = async (id) => {
  try {
    // Utilisation de TA route /sales/search avec le bon paramètre legoSetId
    const response = await fetch(`${BASE_URL}/sales/search?legoSetId=${id}`);
    const body = await response.json();

    // Ton API renvoie { success: true, data: { result: [...] } }
    if (body.success && body.data) {
      return body.data.result || [];
    }
    return [];
  } catch (error) {
    console.error("Erreur Fetch Sales:", error);
    return [];
  }
};

/**
 * Calculate Percentile
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
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  const div = document.createElement('div');
  div.className = 'cards-grid';
  
  const template = deals
    .map(deal => {
      const isFav = favoriteIds.includes(deal.uuid);
      return `
      <div class="deal-card" id="${deal.uuid}">
        <span class="id-badge">ID: ${deal.id || 'N/A'}</span>
        <span class="fav-btn" data-uuid="${deal.uuid}">${isFav ? '❤️' : '🤍'}</span>
        <a href="${deal.link}" target="_blank">${deal.title}</a>
        <span class="price">${deal.price} €</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  sectionDeals.appendChild(div);
};

/**
 * Render list of sales
 */
const renderSales = sales => {
  sectionSales.innerHTML = '<h2>Sales (Vinted)</h2>';
  const div = document.createElement('div');
  div.className = 'cards-grid';
  
  const template = sales
    .map(sale => {
      return `
      <div class="sale-card">
        <a href="${sale.link}" target="_blank">${sale.title}</a>
        <span class="price">${sale.price} €</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  sectionSales.appendChild(div);
};

/**
 * Render indicators
 */
const renderIndicators = pagination => {
  spanNbDeals.innerHTML = pagination.count;
};

const renderLegoSetIds = deals => {
  const ids = deals.map(deal => deal.id).filter(id => id !== null);
  const uniqueIds = [...new Set(ids)]; 
  const options = uniqueIds.map(id => `<option value="${id}">${id}</option>`).join('');
  selectLegoSetIds.innerHTML = '<option value="">Choisir un ID</option>' + options;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderIndicators(pagination);
  renderLegoSetIds(deals);
};

// --- LISTENERS ---

document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchDeals();
  setCurrentDeals(data);
  render(currentDeals, currentPagination);
});

// FEATURE 13 : Favoris
sectionDeals.addEventListener('click', (event) => {
  if (event.target.classList.contains('fav-btn')) {
    const uuid = event.target.getAttribute('data-uuid');
    if (favoriteIds.includes(uuid)) {
      favoriteIds = favoriteIds.filter(id => id !== uuid);
      event.target.textContent = '🤍';
    } else {
      favoriteIds.push(uuid);
      event.target.textContent = '❤️';
    }
    localStorage.setItem('lego-favorites', JSON.stringify(favoriteIds));
  }
});

// FEATURE 14 : Filtrer par Favoris
filterFavoritesBtn.addEventListener('click', () => {
  const filteredDeals = currentDeals.filter(deal => favoriteIds.includes(deal.uuid));
  renderDeals(filteredDeals);
  spanNbDeals.innerHTML = filteredDeals.length;
});

// VENTES (SALES)
selectLegoSetIds.addEventListener('change', async (event) => {
  const legoSetId = event.target.value;
  if (!legoSetId) return;

  const sales = await fetchSales(legoSetId);
  spanNbSales.textContent = sales.length;

  const prices = sales.map(sale => parseFloat(sale.price)).sort((a, b) => a - b);
  const average = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  
  spanAverage.textContent = average.toFixed(2) + ' €';
  spanP5.textContent = calculatePercentile(prices, 5) + ' €';
  spanP25.textContent = calculatePercentile(prices, 25) + ' €';
  spanP50.textContent = calculatePercentile(prices, 50) + ' €';

  renderSales(sales);
});