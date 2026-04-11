'use strict';

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

const VINTED_IDS = [
  '10343','10348','11384','31150','31162','31163','31165','31175','31218',
  '40747','40885','42179','43020','43221','43257','43268','43271','43272',
  '60444','71814','71858','75687','76281','77240','77251','77255'
];

let currentDeals = [];
let currentPagination = {};
let favoriteIds = JSON.parse(localStorage.getItem('lego-favorites')) || [];
let activeFilters = { discount: false, commented: false, hot: false, favorites: false };
let currentSort = '';

const BASE_URL = "https://server-eight-silk-15.vercel.app";
const LEGO_IMG = (id) => `https://images.brickset.com/sets/images/${id}-1.jpg`;

const setCurrentDeals = (data) => {
  currentDeals = data.results || [];
  currentPagination = {
    count: data.total || currentDeals.length,
    currentPage: data.page || 1,
    pageCount: data.pageCount || Math.ceil((data.total || 1) / (data.limit || 12))
  };
};

const fetchDeals = async (page = 1, size = 12) => {
  try {
    const response = await fetch(`${BASE_URL}/deals/search?page=${page}&limit=${size}`);
    const body = await response.json();
    return body;
  } catch (error) {
    console.error("Erreur Fetch Deals:", error);
    return { results: [], total: 0, page: 1, pageCount: 1 };
  }
};

const fetchSales = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/sales/search?legoSetId=${id}`);
    const body = await response.json();
    if (body.success && body.data) {
      return body.data.result || [];
    }
    return [];
  } catch (error) {
    console.error("Erreur Fetch Sales:", error);
    return [];
  }
};

const extractPrice = (p) => {
  if (typeof p === 'number') return p;
  if (typeof p === 'string') return parseFloat(p);
  if (typeof p === 'object' && p !== null) return parseFloat(p.amount || p.value || 0);
  return 0;
};

const calculatePercentile = (arr, p) => {
  if (arr.length === 0) return 0;
  const index = Math.ceil((p / 100) * arr.length) - 1;
  return arr[index];
};

const renderDeals = deals => {
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  const div = document.createElement('div');
  div.className = 'cards-grid';

  const template = deals
    .map(deal => {
      const isFav = favoriteIds.includes(deal.uuid);
      return `
      <div class="deal-card" id="${deal.uuid}">
        <span class="fav-btn" data-uuid="${deal.uuid}">${isFav ? '❤️' : '🤍'}</span>
        ${deal.id ? `<img class="deal-img" src="${LEGO_IMG(deal.id)}" alt="" onerror="this.style.opacity='0'">` : ''}
        <span class="id-badge">Set ${deal.id || 'N/A'}</span>
        ${deal.discount > 0 ? `<span class="discount-badge">-${deal.discount}%</span>` : ''}
        <a href="${deal.link}" target="_blank">${deal.title}</a>
        <span class="price">${deal.price} €</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  sectionDeals.appendChild(div);
};

const renderSales = (sales) => {
  sectionSales.innerHTML = '<h2>Ventes Vinted</h2>';
  const div = document.createElement('div');
  div.className = 'cards-grid';

  const template = sales
    .map(sale => {
      return `
      <div class="sale-card">
        ${sale.image ? `<img class="deal-img" src="${sale.image}" alt="" onerror="this.style.opacity='0'">` : ''}
        <a href="${sale.link}" target="_blank">${sale.title}</a>
        <span class="price">${extractPrice(sale.price).toFixed(2)} €</span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  sectionSales.appendChild(div);
};

const renderIndicators = pagination => {
  spanNbDeals.innerHTML = pagination.count;
};

const renderLegoSetIds = () => {
  const options = VINTED_IDS.map(id => `<option value="${id}">${id}</option>`).join('');
  selectLegoSetIds.innerHTML = options;
};

const renderPagination = ({ currentPage, pageCount }) => {
  selectPage.innerHTML = Array.from({ length: pageCount }, (_, i) =>
    `<option value="${i + 1}" ${i + 1 === currentPage ? 'selected' : ''}>${i + 1}</option>`
  ).join('');
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderIndicators(pagination);
  renderPagination(pagination);
  renderLegoSetIds();
};

const applyFiltersAndSort = () => {
  let result = [...currentDeals];
  if (activeFilters.discount)  result = result.filter(d => d.discount > 20);
  if (activeFilters.commented) result = result.filter(d => d.comments > 5);
  if (activeFilters.hot)       result = result.filter(d => d.temperature > 100);
  if (activeFilters.favorites) result = result.filter(d => favoriteIds.includes(d.uuid));
  if (currentSort === 'price-asc')  result.sort((a, b) => a.price - b.price);
  if (currentSort === 'price-desc') result.sort((a, b) => b.price - a.price);
  if (currentSort === 'date-asc')   result.sort((a, b) => b.published - a.published);
  if (currentSort === 'date-desc')  result.sort((a, b) => a.published - b.published);
  renderDeals(result);
  spanNbDeals.innerHTML = result.length;
};

document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchDeals();
  setCurrentDeals(data);
  render(currentDeals, currentPagination);

  const firstId = VINTED_IDS[0];
  const sales = await fetchSales(firstId);
  spanNbSales.textContent = sales.length;
  const prices = sales.map(sale => extractPrice(sale.price)).sort((a, b) => a - b);
  const average = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  spanAverage.textContent = average.toFixed(2) + ' €';
  spanP5.textContent = calculatePercentile(prices, 5) + ' €';
  spanP25.textContent = calculatePercentile(prices, 25) + ' €';
  spanP50.textContent = calculatePercentile(prices, 50) + ' €';
  renderSales(sales);
});

selectPage.addEventListener('change', async () => {
  const page = parseInt(selectPage.value);
  const size = parseInt(selectShow.value);
  const data = await fetchDeals(page, size);
  setCurrentDeals(data);
  renderPagination(currentPagination);
  renderLegoSetIds();
  renderIndicators(currentPagination);
  applyFiltersAndSort();
});

selectShow.addEventListener('change', async () => {
  const size = parseInt(selectShow.value);
  const data = await fetchDeals(1, size);
  setCurrentDeals(data);
  render(currentDeals, currentPagination);
  applyFiltersAndSort();
});

selectSort.addEventListener('change', () => {
  currentSort = selectSort.value;
  applyFiltersAndSort();
});

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
    if (activeFilters.favorites) applyFiltersAndSort();
  }
});

filterBestDiscount.addEventListener('click', () => {
  activeFilters.discount = !activeFilters.discount;
  filterBestDiscount.classList.toggle('active', activeFilters.discount);
  applyFiltersAndSort();
});

filterMostCommented.addEventListener('click', () => {
  activeFilters.commented = !activeFilters.commented;
  filterMostCommented.classList.toggle('active', activeFilters.commented);
  applyFiltersAndSort();
});

filterHotDeals.addEventListener('click', () => {
  activeFilters.hot = !activeFilters.hot;
  filterHotDeals.classList.toggle('active', activeFilters.hot);
  applyFiltersAndSort();
});

filterFavoritesBtn.addEventListener('click', () => {
  activeFilters.favorites = !activeFilters.favorites;
  filterFavoritesBtn.classList.toggle('active', activeFilters.favorites);
  applyFiltersAndSort();
});

selectLegoSetIds.addEventListener('change', async (event) => {
  const legoSetId = event.target.value;
  if (!legoSetId) return;

  const sales = await fetchSales(legoSetId);
  spanNbSales.textContent = sales.length;

  const prices = sales.map(sale => extractPrice(sale.price)).sort((a, b) => a - b);
  const average = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  spanAverage.textContent = average.toFixed(2) + ' €';
  spanP5.textContent = calculatePercentile(prices, 5) + ' €';
  spanP25.textContent = calculatePercentile(prices, 25) + ' €';
  spanP50.textContent = calculatePercentile(prices, 50) + ' €';

  renderSales(sales);
});
