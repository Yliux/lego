import * as cheerio from 'cheerio';
import { v5 as uuidv5 } from 'uuid';

// 🍪 AJOUTE TON COOKIE DEALABS ICI 🍪
// Remplace "ton_cookie_dealabs_complet_ici" par le vrai cookie récupéré dans ton navigateur
const COOKIE = "dont-track=0; f_c=1; g_p=1; cookie_policy_agreement=3; view_layout_horizontal=%221-1%22; hide_local=0; time_frame=365; sort_by=%22new%22; hide_expired=1; f_v=%22b954cd2c-d512-11f0-8e9a-0242ac110003%22; show_my_tab=0; browser_push_permission_requested=1769418782; navi=%7B%22homepage%22%3A%22highlights%22%2C%22hottest-widget-time%22%3A%22day%22%7D; pepper_session=%22A1CJBAa1dgWkEszVXapD2cJ098iDhwjt0d6fT6VV%22; u_l=0; xsrf_t=%227UOBkpx4tYnYU3qGlO5PXznA6Mnk0Al5RKmCKJbX%22; l_p_u_t_ts=1773168211";

/**
 * Parse webpage data response
 * @param  {String} data - html response
 * @return {Array} list of deals
 */
const parse = data => {
  const $ = cheerio.load(data);

  return $('article.thread')
    .map((i, element) => {
      // Extraction du lien et du titre
      const titleElement = $(element).find('strong.thread-title a');
      const title = titleElement.attr('title') || titleElement.text().trim();
      const link = titleElement.attr('href');
      
      // Extraction du prix
      const priceText = $(element).find('span.thread-price').text().trim();
      const price = priceText ? parseFloat(priceText.replace(/[^0-9,.]/g, '').replace(',', '.')) : null;

      // Extraction de la température (hot deals)
      const tempText = $(element).find('span.cept-vote-temp').text().trim();
      const temperature = tempText ? parseInt(tempText.replace(/[^0-9-]/g, '')) : 0;

      // Extraction du nombre de commentaires
      const commentsText = $(element).find('span.cept-comment-link').text().trim();
      const comments = commentsText ? parseInt(commentsText.replace(/[^0-9]/g, '')) : 0;

      return {
        title,
        price,
        temperature,
        comments,
        link,
        uuid: link ? uuidv5(link, uuidv5.URL) : null
      };
    })
    .get()
    .filter(deal => deal.title); // On filtre pour enlever les potentiels articles vides
};

/**
 * Scrape a given url page
 * @param {String} url - url to parse and scrape
 * @returns {Promise<Array>}
 */
export const scrape = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Cookie': COOKIE, // <-- LE COOKIE EST INJECTÉ ICI
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (response.ok) {
      const body = await response.text();
      return parse(body);
    }

    console.error(`❌ Erreur Dealabs: ${response.status} ${response.statusText}`);
    return null;
  } catch (error) {
    console.error('❌ Erreur de scraping Dealabs:', error);
    return null;
  }
};