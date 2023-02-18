const salesItemList = document.getElementById("sales-item-list");
const loadingIndicator = document.getElementById("loading-indicator");
const notFoundText = document.getElementById("not-found-text");

const ERROR_MESSAGE =
  "Could not find the item you' looking for. try again later";

const stopLoading = () => {
  loadingIndicator.remove();
};

function handleError(message) {
  stopLoading();
  notFoundText.style.marginTop = 20;
  notFoundText.innerText = message || ERROR_MESSAGE;
  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ currentWindow: true, active: true }, async (tabs) => {
    const keywords = new URL(tabs[0].url).searchParams.get("_nkw"); // get search term from url
    if (!keywords) {
      return handleError(
        "Search for an item on Ebay to view sales ending soon..."
      );
    }

    fetch("https://fivebay.onrender.com/search?q=" + keywords)
      .then((res) => res.json())
      .then((response) => {
        if (response.count == 0) {
          return handleError(
            ERROR_MESSAGE + " try using a different search term."
          );
        }

        if (response.data)
          for (const sale of response.data) {
            salesItemList.innerHTML += listItem(sale);
          }

        stopLoading();
      })
      .finally(() => {})
      .catch(() => {
        return handleError();
      });
  });
});

function listItem(props) {
  const deadlineTimeRegex = /T(\d+)H(\d+)M(\d+)S/;
  const match = deadlineTimeRegex.exec(props.timeLeft);
  const minutes = parseInt(match[2]);

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
          <p class="sales-item-time-left">Time left: Under ${
            minutes == 5 ? minutes : minutes + 1
          } minutes</p>
          <p class="sales-item-location">from ${props.country}</p>
        </div>
      </a>
    </li>
  `;
}
