import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8092;
const app = express();

// Variables pour stocker nos données en mémoire
let SALES = {}; // Format: { "10348": [ventes...], "77255": [ventes...] }
let DEALS = []; // Format: [ {deal1}, {deal2}, ... ]

app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

// ----------------------------------------------------
// Route de test par défaut
// ----------------------------------------------------
app.get('/', (request, response) => {
  response.send({'ack': true});
});


// ----------------------------------------------------
// 1. GET /deals/search (Rechercher et filtrer des deals)
// ----------------------------------------------------
app.get('/deals/search', (request, response) => {
  const limit = parseInt(request.query.limit) || 12;
  const price = parseFloat(request.query.price);
  
  let results = [...DEALS];

  // Filtre par prix maximum si demandé
  if (price) {
    results = results.filter(deal => deal.price <= price);
  }

  // Tri du moins cher au plus cher
  results.sort((a, b) => a.price - b.price);

  const total = results.length;
  results = results.slice(0, limit);

  return response.status(200).json({
    limit: limit,
    total: total,
    results: results
  });
});


// ----------------------------------------------------
// 2. GET /deals/:id (Trouver un deal précis)
// ----------------------------------------------------
app.get('/deals/:id', (request, response) => {
  const { id } = request.params;
  
  // Cherche le deal correspondant par son UUID
  const deal = DEALS.find(d => d.uuid === id || d._id === id || d.id === id);

  if (deal) {
    return response.status(200).json(deal);
  } else {
    return response.status(404).json({ error: "Deal introuvable" });
  }
});


// ----------------------------------------------------
// 3. GET /sales/search (Rechercher des ventes Vinted)
// ----------------------------------------------------
app.get('/sales/search', (request, response) => {
  const limit = parseInt(request.query.limit) || 12;
  const { legoSetId } = request.query;

  let results = SALES[legoSetId] || [];

  // Tri de la vente la plus récente à la plus ancienne
  results.sort((a, b) => (b.published || 0) - (a.published || 0));

  const total = results.length;
  results = results.slice(0, limit);

  return response.status(200).json({
    limit: limit,
    total: total,
    results: results
  });
});


// ----------------------------------------------------
// Démarrage du serveur et chargement des données
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`📡 API Running on port ${PORT}`);
  
  // Chargement des ventes Vinted
  try {
    const salesData = readFileSync(path.join(__dirname, 'sources', 'vinted.json'), 'utf8');
    SALES = JSON.parse(salesData);
    console.log(`✅ Fichier vinted.json chargé.`);
  } catch (error) {
    console.warn(`⚠️ Impossible de charger vinted.json : ${error.message}`);
  }

  // Chargement des promotions Dealabs
  try {
    const dealsData = readFileSync(path.join(__dirname, 'sources', 'dealabs.json'), 'utf8');
    DEALS = JSON.parse(dealsData);
    console.log(`✅ Fichier dealabs.json chargé (${DEALS.length} deals).`);
  } catch (error) {
    console.warn(`⚠️ Impossible de charger dealabs.json : ${error.message}`);
  }
});