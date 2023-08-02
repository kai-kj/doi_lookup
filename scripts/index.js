import { Article } from "./article.js";

/*
    10.1016/j.imavis.2005.02.004
*/

const headerLink = document.getElementById(`header-link`);

const doiSearchField = document.getElementById(`doi-search-field`);
const doiSearchButton = document.getElementById(`doi-search-button`);

const msgSection = document.getElementById(`msg-section`);

const articleInfoSection = document.getElementById(`article-section`);
const articleInfoTitle = document.getElementById(`article-info-title`);
const articleInfoAuthor = document.getElementById(`article-info-author`);
const articleAccess = document.getElementById(`article-access`);

const articleBibtexField = document.getElementById(`article-bibtex-field`);
const articleBibtexCopy = document.getElementById(`article-bibtex-copy`);

const articleAbstractField = document.getElementById(`article-abstract-field`);

const articleStatCitation = document.getElementById(`article-stat-cit`);
const articleStatReference = document.getElementById(`article-stat-ref`);

let currentArticle = undefined;

const createSpinner = function (size) {
    const spinner = document.createElement(`div`);
    spinner.classList.add(`spinner`);
    spinner.style.width = size;
    spinner.style.height = size;
    return spinner;
};

const createArticleStatListItem = function (doi, parent) {
    const div = document.createElement(`div`);
    div.classList.add(`article-stat-list-item`);
    div.classList.add(`border`);
    div.appendChild(createSpinner(`12px`));
    div.appendChild(document.createTextNode(`${doi}`));

    const a = document.createElement(`a`);
    a.href = `${window.location.href.split(`?`)[0]}?doi=${doi}`;
    a.appendChild(div);

    parent.appendChild(a);

    Article.from(doi).then((article) => {
        if (article) div.innerHTML = article.getTitle();
    });
};

const showArticleCurrent = function () {
    if (currentArticle === undefined) {
        console.log(`article undefined`);
        return;
    }

    articleInfoTitle.innerHTML = `${currentArticle.getTitle()}`;
    articleInfoAuthor.innerHTML = `${currentArticle
        .getAuthors()
        .join(`&nbsp&nbsp&nbsp&nbsp`)}`;

    articleBibtexField.innerHTML = `${currentArticle.toBibtex()}`;
    articleAbstractField.innerHTML = `${currentArticle.getAbstract()}`;

    while (articleStatCitation.firstChild) {
        articleStatCitation.removeChild(articleStatCitation.firstChild);
    }

    while (articleStatReference.firstChild) {
        articleStatReference.removeChild(articleStatReference.firstChild);
    }

    currentArticle
        .getCitations()
        .map((doi) => createArticleStatListItem(doi, articleStatCitation));

    currentArticle
        .getReferences()
        .map((doi) => createArticleStatListItem(doi, articleStatReference));

    articleInfoSection.style.display = `block`;
    msgSection.style.display = `none`;
};

const showArticleSearching = function () {
    while (msgSection.firstChild) msgSection.removeChild(msgSection.firstChild);
    msgSection.appendChild(createSpinner(`20px`));

    articleInfoSection.style.display = `none`;
    msgSection.style.display = `block`;
};

const showArticleNotFound = function () {
    while (msgSection.firstChild) msgSection.removeChild(msgSection.firstChild);
    msgSection.innerHTML = `article not found`;

    articleInfoSection.style.display = `none`;
    msgSection.style.display = `block`;
};

const showArticleNone = function () {
    articleInfoSection.style.display = `none`;
    msgSection.style.display = `none`;
};

const search = async function (doi) {
    showArticleSearching();
    currentArticle = await Article.from(doi);

    if (currentArticle) {
        showArticleCurrent();
    } else {
        showArticleNotFound();
    }

    // window.location.search = doi;
    window.history.replaceState(
        {},
        ``,
        `${window.location.href.split(`?`)[0]}?doi=${doi}`
    );
};

doiSearchField.addEventListener(`keypress`, function (event) {
    if (event.key === `Enter`) {
        doiSearchButton.click();
    }
});

doiSearchButton.addEventListener(`click`, async function (event) {
    search(doiSearchField.value.trim());
});

articleAccess.addEventListener(`click`, async function (event) {
    window.open(currentArticle.getURL());
});

articleBibtexCopy.addEventListener(`click`, async function (event) {
    navigator.clipboard.writeText(currentArticle.toBibtex());
});

window.onpageshow = function () {
    headerLink.href = window.location.href.split(`?`)[0];

    showArticleNone();

    const urlParams = new URLSearchParams(window.location.search);
    const doi = urlParams.get(`doi`);
    if (doi != null) {
        doiSearchField.value = doi;
        doiSearchButton.click();
    }
};
