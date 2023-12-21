const apiBaseUrl = "https://api.publicapis.org";

async function getPublicApi(endpoint, query = {}) {
  let requestOptions = {
    method: "GET",
    redirect: "follow",
  };

  const url = new URL(`${apiBaseUrl}${endpoint}`);
  let queryParam = new URLSearchParams(query);
  url.search = queryParam;

  return await fetch(url, requestOptions)
    .then((response) => response.text())
    .then((result) => {
      return JSON.parse(result);
    })
    .catch((error) => console.log("error", error));
}

var activeCategory = 0;
var activeCategoryName = "";
var categories = [];

function initCategories() {
  let catElem = document.querySelector("ul.category");
  let isActive = activeCategory == 0 ? "class='cat active'" : "class='cat'";
  catElem.innerHTML = `<li ${isActive} data-id="0">All</li>`;
  categories.map((cat) => {
    let isActive =
      activeCategory == cat.id ? "class='cat active'" : "class='cat'";
    catElem.innerHTML += `<li ${isActive} data-id="${cat.id}" data-name="${cat.name}">${cat.name}</li>`;
  });
}

var entries = [];
var pages = [];
const showOnPages = 12;
var currentPage = 1;

async function getCategoryEntries(category = undefined) {
  if (category) {
    return await getPublicApi("/entries", { category });
  } else {
    return await getPublicApi("/entries");
  }
}

function updateContent() {
  let contentElem = document.querySelector("section.content-wrapper");
  contentElem.innerHTML = "";
  pages[currentPage - 1].map((item) => {
    contentElem.innerHTML += `
                <div class="main-item">
                    <img src="./assets/img/full-logo.webp" alt="">
                    <h3> ${item.name}</h3>
                    <p>
                        ${item.description}
                    </p>
                </div>
        `;
  });
  updatePagination();
}

function entriesToPage() {
  pages = [];
  for (let i = 0; i < entries.length; i += showOnPages) {
    const page = entries.slice(i, i + showOnPages);
    pages.push(page);
  }
}

function paginate({ current, max }) {
  if (!current || !max) return null;

  let prev = current === 1 ? null : current - 1,
    next = current === max ? null : current + 1,
    items = [1];

  if (current === 1 && max === 1) return { current, prev, next, items };
  if (current > 4) items.push("…");

  let r = 2,
    r1 = current - r,
    r2 = current + r;

  for (let i = r1 > 2 ? r1 : 2; i <= Math.min(max, r2); i++) items.push(i);

  if (r2 + 1 < max) items.push("…");
  if (r2 < max) items.push(max);

  return { current, prev, next, items };
}
function updatePagination() {
  let prevContainer = document.querySelector(
    "section.pagination .prev-container"
  );
  let nextContainer = document.querySelector(
    "section.pagination .next-container"
  );
  let paginationElem = document.querySelector("section.pagination .page");
  if (currentPage > 1) {
    prevContainer.innerHTML = `<span class="prev"><i class="fas fa-arrow-left"></i></span>`;
  } else {
    prevContainer.innerHTML = "";
  }

  paginationElem.innerHTML = "";
  pagination = paginate({ current: currentPage, max: pages.length });
  pagination.items.map((item) => {
    if (typeof item == "number") {
      if (item == currentPage) {
        paginationElem.innerHTML += `<h4 class="num-page active" data-page='${item}' disable>${item}</h4>`;
      } else {
        paginationElem.innerHTML += `<h4 class="num-page" data-page='${item}'>${item}</h4>`;
      }
    } else {
      paginationElem.innerHTML += `<h4>${item}</h4>`;
    }
  });
  if (currentPage < pages.length) {
    nextContainer.innerHTML = `<span class="next"><i class="fas fa-arrow-right"></i></span>`;
  } else {
    nextContainer.innerHTML = "";
  }

  let prev = document.querySelector(".prev");
  let next = document.querySelector(".next");
  let pageNumber = document.querySelectorAll(".num-page");
  if (prev) {
    prev.addEventListener("click", function () {
      if (currentPage > 1) {
        currentPage -= 1;
        updateContent();
      }
    });
  }
  if (next) {
    next.addEventListener("click", function () {
      if (currentPage < pages.length) {
        currentPage = parseInt(currentPage) + 1;
        updateContent();
      }
    });
  }
  if (pageNumber) {
    pageNumber.forEach((element) => {
      element.addEventListener("click", function () {
        currentPage = parseInt(this.dataset.page);
        updateContent();
      });
    });
  }
}

getPublicApi("/categories")
  .then((list) => {
    let id = 1;
    list.categories.map((cat) => {
      categories.push({
        id,
        name: cat,
      });
      id++;
    });
  })
  .then(() => {
    initCategories();
  })
  .then(() => {
    let listCatElems = document.querySelectorAll(".cat");
    listCatElems.forEach((element) => {
      element.addEventListener("click", function () {
        currentPage = 1;
        let currentActiveCat = document.querySelector(
          `.cat[data-id="${activeCategory}"`
        );
        currentActiveCat.classList.toggle("active");
        activeCategory = this.dataset.id;
        activeCategoryName = this.dataset.name;
        this.classList.toggle("active");
        entries = [];

        getCategoryEntries(activeCategoryName).then((dataEntry) => {
          dataEntry.entries.map((data) => {
            entries.push({
              name: data.API,
              description: data.Description,
            });
          });
          entriesToPage();
          updateContent();
        });
      });
    });
  });

getCategoryEntries(activeCategoryName).then((dataEntry) => {
  dataEntry.entries.map((data) => {
    entries.push({
      name: data.API,
      description: data.Description,
    });
  });
  entriesToPage();
  updateContent();
});
