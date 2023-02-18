import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import express, { json } from "express";
import morgan from "morgan";

dotenv.config();
const { EBAY_APP_ID } = process.env;

const ebayEndpoint = "https://svcs.ebay.com/services/search/FindingService/v1";

/**
 * returns hours and minutes to sell deadline
 * @param {string} durationString
 * @returns {match: boolean, hours: number, minutes: number}
 */
function extractTime(durationString) {
  const deadlineTimeRegex = /T(\d+)H(\d+)M(\d+)S/;
  const match = deadlineTimeRegex.exec(durationString);

  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  return { match: match != null, hours, minutes };
}

/**
 * return parsed sale item object
 * @param {object} sale
 * */
function buildParsedSales(sale) {
  return {
    title: sale.title[0], // item title
    shippingType: sale.shippingInfo[0].shippingType[0], // shipping type
    shippingLocations: sale.shippingInfo[0].shipToLocations[0], // shipping locations
    country: sale.country[0], // country of origin
    img: sale.galleryURL[0], // item image
    url: sale.viewItemURL[0], // item url
    condition: sale.condition[0].conditionDisplayName[0], // item condition
    category: sale.primaryCategory[0].categoryName[0], // item category
    price: sale.sellingStatus[0].currentPrice[0].__value__, // item price
    timeLeft: sale.sellingStatus[0].timeLeft[0], // time left to sale end
  };
}

/**
 * requests for matching sales that end in less than 5 minutes
 * @param {string} searchKeywords
 * @returns
 */
async function fetchItem(searchKeywords) {
  const endingItems = [];

  const auctionParams =
    "?itemFilter(0).name=ListingType&itemFilter(0).value=Auction&paginationInput.entriesPerPage=15";

  const { data } = await axios.get(ebayEndpoint + auctionParams, {
    params: {
      "OPERATION-NAME": "findItemsByKeywords",
      "SERVICE-VERSION": "1.0.0",
      "SECURITY-APPNAME": EBAY_APP_ID,
      "RESPONSE-DATA-FORMAT": "JSON",
      keywords: searchKeywords,
    },
  });

  const items = data.findItemsByKeywordsResponse[0].searchResult[0].item;

  for (let index = 0; index < items.length; index++) {
    const durationString = items[index].sellingStatus[0].timeLeft[0];
    const { match, hours, minutes } = extractTime(durationString);

    if (match && hours == 0 && minutes <= 6) {
      const currentSaleItem = items[index];
      const structuredSaleItem = buildParsedSales(currentSaleItem);
      endingItems.push(structuredSaleItem);
    }
  }
  return endingItems;
}

const app = express();
app.use(json());
app.use(cors());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  const developer = `
    <h2>Developer</h1>
    <a href="https://github.com/mwelwankuta>Github: @mwelwankuta</a>
    <a href="https://linkedin.com/in/mwelwa>Linked: /in/mwelwa</a>
    <a href="https://twitter.com/mwelwankuta>Twitter: @mwelwankuta</a>
  `;
  res.send(developer);
});

app.get("/search", async (req, res) => {
  const keywords = req.query.q;
  if (!keywords) {
    return res
      .status(400)
      .send({ message: "you did not provide a search term" });
  }

  try {
    const results = await fetchItem(keywords);
    res.status(200).send({ count: results.length, keywords, data: results });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
