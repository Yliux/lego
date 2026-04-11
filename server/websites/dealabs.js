import * as cheerio from 'cheerio';
import { v5 as uuidv5 } from 'uuid';

const COOKIE = "dont-track=0; f_c=1; g_p=1; cookie_policy_agreement=3; view_layout_horizontal=%221-1%22; hide_local=0; time_frame=365; sort_by=%22new%22; hide_expired=1; f_v=%22b954cd2c-d512-11f0-8e9a-0242ac110003%22; show_my_tab=0; browser_push_permission_requested=1769418782; navi=%7B%22homepage%22%3A%22highlights%22%2C%22hottest-widget-time%22%3A%22day%22%7D; pepper_session=%226UR6s0BnIokA1kPGsRM73MjcDHTyvBdgTpwD2YMH%22; xsrf_t=%22WXK5zVNnC9g9FDReAbVgT3eNcfHhCQ2kb7GEI7Pd%22; u_l=0; l_p_u_t_ts=1775920955";

// --- FONCTIONS D'AIDE (HELPERS) ---

const formatImage = (mainImage) => {
  if (!mainImage) return null;
  return typeof mainImage === 'string' ? mainImage : (mainImage.path || mainImage.url || null);
};

const extractSetId = (title) => {
  if (!title) return null;
  const match = title.match(/\b\d{5}\b/);
  return match ? match[0] : null;
};


// --- FONCTION DE PARSING ---

/**
 * Parse webpage data response
 * @param  {String} data - html response
 * @return {Array} list of deals
 */
const parse = data => {
  const $ = cheerio.load(data); 

  return $('div.js-threadList article')
    .map((i, element) => {
      try {
        // 1. Récupération du lien (grâce à ton super sélecteur !)
        let link = $(element)
          .find('a[data-t="threadLink"]')
          .attr('href');

        if (link && !link.startsWith('http')) {
          link = `https://www.dealabs.com${link}`;
        }

        // 2. Récupération du JSON Vue3
        const vueDataString = $(element)
          .find('div.js-vue3')
          .attr('data-vue3');

        if (!vueDataString) return null;

        const vueData = JSON.parse(vueDataString);
        const thread = vueData.props?.thread;

        if (!thread) return null;

        // 3. Application des variables
        const retail = thread.nextBestPrice || thread.price; 
        const price = thread.price;
        const discount = (retail && price && retail > price) 
          ? parseInt(((retail - price) / retail) * 100) 
          : 0;
        
        const temperature = +thread.temperature || 0;
        const photo = formatImage(thread.mainImage);
        const comments = +thread.commentCount || 0;
        const published = thread.publishedAt;
        const title = thread.title;
        const id = extractSetId(title);

        // 4. Objet final retourné
        return {
          id,
          title,
          price,
          retail,
          discount,
          temperature,
          comments,
          published,
          photo,
          link, // <-- Le lien est bien là !
          uuid: link ? uuidv5(link, uuidv5.URL) : null // <-- L'UUID marchera !
        };

      } catch (error) {
        return null; // On ignore les éléments qui plantent
      }
    })
    .get()
    .filter(deal => deal !== null); // On nettoie les potentiels null du tableau
};


// --- FONCTION DE SCRAPING (API) ---

/**
 * Scrape a given url page
 * @param {String} url - url to parse and scrape
 * @returns {Promise<Array>}
 */
export const scrape = async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Cookie': COOKIE,
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