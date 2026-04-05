import fs from 'fs';
import { scrape } from './websites/dealabs.js';

const run = async () => {
  console.log("🕵️‍♂️ Lancement du scraper...");
  
  // On va chercher les deals sur internet
  const deals = await scrape('https://www.dealabs.com/groupe/lego'); 
  
  if (deals && deals.length > 0) {
    // On écrase le fichier du prof avec tes nouvelles données !
    fs.writeFileSync('./sources/dealabs.json', JSON.stringify(deals, null, 2));
    console.log(`✅ Succès ! ${deals.length} deals ont été sauvegardés dans sources/dealabs.json`);
  } else {
    console.log("❌ Oups, aucun deal n'a été trouvé. Vérifie ton cookie !");
  }
};

run();