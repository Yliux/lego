/**
 * Script de rafraîchissement des données
 * Usage : node refresh.js
 *
 * Met à jour dealabs.json et vinted.json dans /sources
 */

import { writeFileSync } from 'fs';
import { scrape as scrapeDealabes } from './websites/dealabs.js';
import { scrape as scrapeVinted } from './websites/vinted.js';

const DEALABS_URL = 'https://www.dealabs.com/groupe/lego';

const VINTED_IDS = [
  '10343','10348','11384','31150','31162','31163','31165','31175','31218',
  '40747','40885','42179','43020','43221','43257','43268','43271','43272',
  '60444','71814','71858','75687','76281','77240','77251','77255'
];

// --- Dealabs ---
const refreshDeals = async () => {
  console.log('🔍 Scraping Dealabs...');
  const allDeals = [];
  let page = 1;

  while (true) {
    const url = `${DEALABS_URL}?page=${page}`;
    process.stdout.write(`  → Page ${page}... `);
    const deals = await scrapeDealabes(url);

    if (!deals || deals.length === 0) {
      console.log('fin.');
      break;
    }

    console.log(`${deals.length} deals`);
    allDeals.push(...deals);
    page++;

    // Pause pour éviter le rate limiting
    await new Promise(r => setTimeout(r, 800));
  }

  if (allDeals.length === 0) {
    console.error('❌ Aucun deal récupéré. Vérifie ton cookie Dealabs dans websites/dealabs.js');
    return false;
  }

  writeFileSync('./sources/dealabs.json', JSON.stringify(allDeals, null, 2));
  console.log(`✅ ${allDeals.length} deals sauvegardés dans sources/dealabs.json`);
  return true;
};

// --- Vinted ---
const refreshSales = async () => {
  console.log('🔍 Scraping Vinted...');
  const allSales = {};

  for (const id of VINTED_IDS) {
    process.stdout.write(`  → Set ${id}... `);
    const sales = await scrapeVinted(id);

    if (sales && sales.length > 0) {
      allSales[id] = sales;
      console.log(`${sales.length} ventes`);
    } else {
      allSales[id] = [];
      console.log('0 ventes');
    }

    // Pause pour éviter le rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  writeFileSync('./sources/vinted.json', JSON.stringify(allSales, null, 2));
  console.log(`✅ Ventes sauvegardées dans sources/vinted.json`);
  return true;
};

// --- Main ---
(async () => {
  console.log('🚀 Démarrage du scraping...\n');

  await refreshDeals();
  console.log('');
  await refreshSales();

  console.log('\n✅ Scraping terminé ! Redéploie sur Vercel pour mettre à jour le site.');
})();
