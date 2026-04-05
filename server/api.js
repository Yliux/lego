import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

// Importation directe et sécurisée pour Vercel (remplace le readFileSync qui plante en ligne)
import SALES from "./sources/vinted.json" with { type: "json" };
import DEALS from "./sources/dealabs.json" with { type: "json" };

const PORT = 8092;
const app = express();

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

  // Format renvoyé (Ton frontend s'attend à lire ça !)
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
  // Headers de sécurité CORS
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  try {
    const limit = parseInt(request.query.limit) || 12;
    const { legoSetId } = request.query;

    let results = SALES[legoSetId] || [];

    // Tri de la vente la plus récente à la plus ancienne
    results.sort((a, b) => (b.published || 0) - (a.published || 0));

    const total = results.length;
    results = results.slice(0, limit);

    // Format avec "success" et "data" (Ton frontend s'attend à lire ça !)
    return response.status(200).json({
      'success': true,
      'data': {
        'result': results
      }
    });
  } catch (error) {
    console.log(error);
    return response.status(500).send({
      'success': false,
      'data': {'result': []}
    });
  }
});

// ----------------------------------------------------
// Démarrage du serveur
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`📡 API Running on port ${PORT}`);
});

// Exportation vitale pour Vercel
export default app;