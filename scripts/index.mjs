/*
    10.1016/j.imavis.2005.02.004
*/

import { Article } from "./article.mjs";
import { SF } from "./sf.mjs";

const headerLink = SF.Node.fromQuery(`#header-link`);
const doiSearchField = SF.Node.fromQuery(`#doi-search-field`);
const doiSearchButton = SF.Node.fromQuery(`#doi-search-button`);
const msgSection = SF.Node.fromQuery(`#msg-section`);
const articleInfoSection = SF.Node.fromQuery(`#article-section`);
const articleInfoTitle = SF.Node.fromQuery(`#article-info-title`);
const articleInfoAuthor = SF.Node.fromQuery(`#article-info-author`);
const articleAccess = SF.Node.fromQuery(`#article-access`);
const articleCiteField = SF.Node.fromQuery(`#article-cite-field`);
const articleCiteCopy = SF.Node.fromQuery(`#article-cite-copy`);
const articleStatCitation = SF.Node.fromQuery(`#article-stat-cit`);
const articleStatReference = SF.Node.fromQuery(`#article-stat-ref`);

let currentArticle = undefined;

const getURL = () => window.location.href.split(`?`)[0];

const createSpinner = (size) =>
    SF.Node.fromTag(`div`)
        .addClass(`spinner`)
        .setStyle(`width`, size)
        .setStyle(`height`, size);

const createPreview = (doi) =>
    SF.Node.fromTag(`a`)
        .setAttribute(`href`, `${getURL()}?doi=${doi}`)
        .addChild(
            SF.Node.fromTag(`div`)
                .addClass(`article-stat-list-item`)
                .addClass(`border`)
                .addChild(createSpinner(`12px`))
                .addChild(doi)
                .onPromise(Article.from(doi), (node, article) => {
                    if (article) node.clear().addChild(article.getTitle());
                })
        );

const showArticleCurrent = function () {
    articleInfoTitle.clear().addChild(currentArticle.getTitle());
    articleInfoAuthor.clear().addChild(currentArticle.getAuthors().join(` | `));

    articleCiteField
        .clear()
        .addChild(createSpinner(`12px`))
        .onPromise(currentArticle.asBibtext(), (node, value) => {
            node.clear().addChild(value);
        });

    articleStatReference
        .clear()
        .addChild(createSpinner(`12px`))
        .onPromise(currentArticle.getReferences(), (node, dois) =>
            node.clear().addChildren(dois.map((doi) => createPreview(doi)))
        );

    articleStatCitation
        .clear()
        .addChild(createSpinner(`12px`))
        .onPromise(currentArticle.getCitations(), (node, dois) =>
            node.clear().addChildren(dois.map((doi) => createPreview(doi)))
        );

    articleInfoSection.setStyle(`display`, `block`);
    msgSection.setStyle(`display`, `none`);
};

const showArticleSearching = function () {
    msgSection.clear().addChild(createSpinner(`20px`));
    articleInfoSection.setStyle(`display`, `none`);
    msgSection.setStyle(`display`, `block`);
};

const showArticleNotFound = function () {
    msgSection.clear().addChild(`article not found`);
    articleInfoSection.setStyle(`display`, `none`);
    msgSection.setStyle(`display`, `block`);
};

const showArticleNone = function () {
    articleInfoSection.setStyle(`display`, `none`);
    msgSection.setStyle(`display`, `none`);
};

const search = async function (doi) {
    showArticleSearching();
    currentArticle = await Article.from(doi);
    if (currentArticle) showArticleCurrent();
    else showArticleNotFound();
    window.history.replaceState({}, ``, `${getURL()}?doi=${doi}`);
};

doiSearchField.onEvent(`keypress`, function (event) {
    if (event.key === `Enter`) doiSearchButton.callEvent(`click`);
});

doiSearchButton.onEvent(`click`, (_) =>
    search(doiSearchField.getRawElement().value.trim())
);

articleAccess.onEvent(`click`, (_) => window.open(currentArticle.getURL()));

articleCiteCopy.onEvent(`click`, (_) =>
    navigator.clipboard.writeText(currentArticle.toBibtex())
);

window.onpageshow = function () {
    headerLink.href = getURL();
    showArticleNone();

    const urlParams = new URLSearchParams(window.location.search);
    const doi = urlParams.get(`doi`);
    if (doi != null) {
        doiSearchField.getRawElement().value = doi;
        doiSearchButton.callEvent(`click`);
    }
};
