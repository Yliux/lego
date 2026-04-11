import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import SALES from "./sources/vinted.json" with { type: "json" };
import DEALS from "./sources/dealabs.json" with { type: "json" };

const PORT = 8092;
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(helmet());

app.get('/', (request, response) => {
  response.send({ ack: true });
});

app.get('/deals/search', (request, response) => {
  const limit = parseInt(request.query.limit) || 12;
  const page = parseInt(request.query.page) || 1;
  const price = parseFloat(request.query.price);

  let results = [...DEALS];

  if (price) {
    results = results.filter(deal => deal.price <= price);
  }

  results.sort((a, b) => a.price - b.price);

  const total = results.length;
  const pageCount = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  results = results.slice(offset, offset + limit);

  return response.status(200).json({ limit, page, total, pageCount, results });
});

app.get('/deals/:id', (request, response) => {
  const { id } = request.params;
  const deal = DEALS.find(d => d.uuid === id || d._id === id || d.id === id);

  if (deal) {
    return response.status(200).json(deal);
  } else {
    return response.status(404).json({ error: "Deal introuvable" });
  }
});

app.get('/sales/search', (request, response) => {
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  try {
    const { legoSetId } = request.query;
    let results = SALES[legoSetId] || [];
    results.sort((a, b) => (b.published || 0) - (a.published || 0));

    return response.status(200).json({
      success: true,
      data: { result: results }
    });
  } catch (error) {
    console.log(error);
    return response.status(500).send({
      success: false,
      data: { result: [] }
    });
  }
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

export default app;
