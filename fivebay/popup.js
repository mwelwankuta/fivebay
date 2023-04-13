const salesItemList = document.getElementById("sales-item-list");
const salesItemTitle = document.getElementById("sales-item-title");
const loadingIndicator = document.getElementById("loading-indicator");
const notFoundText = document.getElementById("not-found-text");

const ERROR_MESSAGE =
  "Could not find the item you' looking for. try again later";

const stopLoading = () => loadingIndicator.remove();

/**
* shows error on popup.
**/
function handleError(message) {
  stopLoading();
  notFoundText.style.marginTop = 20;
  notFoundText.innerText = message || ERROR_MESSAGE;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    chrome.tabs.query({ currentWindow: true, active: true }, async (tabs) => {
      const keywords = new URL(tabs[0].url).searchParams.get("_nkw");
      if (!keywords) {
        handleError(
          "Could not get search keywords from. Search for an item on Ebay to view sales ending soon..."
        );
        return;
      }

      const response = await fetch("https://fivebay.onrender.com/search?q=" + keywords);
      const json = await response.json()

      // server returns no data
      if (!json.count) {
        handleError(
          ERROR_MESSAGE + " try using a different search term."
        );
        return;
      }

      displaySaleItems(json.data);
    });


  } catch (error) {
    handleError("There was a problem looking for your items, contact developer.");
    return;
  }
});

/**
* renders sale items to the dom
**/
function displaySaleItems(sales) {
  let items = ''

  for (const sale of sales) {
    items += listItem(sale);
  }

  salesItemTitle.innerText = "Auctions ending soon"
  salesItemList.innerHTML = items;
  stopLoading();
}

/**
* sale list item template
**/
function listItem(props) {
  const deadlineTimeRegex = /T(\d+)H(\d+)M(\d+)S/;
  const minutes = parseInt(deadlineTimeRegex.exec(props.timeLeft)[2]);

  const endingTime = minutes == 10 ? minutes : minutes + 1;

  return `
    <li class="sales-item-holder">
      <a href="${props.url}" class="sales-item" target="_blank">
        <div class="sales-item-image-holder">
          <img
            class="sales-item-image"
            src="${props.img}"
            alt="${props.title}"
          />
        </div>
        <div class="sales-item-info">
          <h3 class="sales-item-title">${props.title}</h3>
          <p class="sales-item-condition">${props.condition}</p>
          <h1 class="sales-item-price">$${props.price}</h1>
          <p class="sales-item-time-left">Ending in Under ${endingTime} minutes</p>
          <p class="sales-item-location">from ${props.country}</p>
        </div>
      </a>
    </li>
  `;
}
