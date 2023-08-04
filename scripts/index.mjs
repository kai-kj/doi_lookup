/*
    10.1093/neuonc/nox106
*/

import { Article } from "./article.mjs";
import { SF } from "./sf.mjs";

let currentArticle = undefined;

const getURL = () => window.location.href.split(`?`)[0];

const slowForEach = function (array, time, fn) {
    if (array.length == 0) return;
    fn(array[0]);
    setTimeout(() => slowForEach(array.slice(1), time, fn), time);
};

const tableRow = (key, value) =>
    SF.new(`tr`)
        .append(
            SF.new(`td`)
                .append(SF.new(`b`).append(key))
                .setStyle(`white-space`, `nowrap`)
        )
        .append(SF.new(`td`).append(value));

const createSpinner = (size) =>
    SF.new(`div`)
        .addClass(`spinner`)
        .setStyle(`width`, size)
        .setStyle(`height`, size);

const createPreview = (doi) =>
    SF.new(`div`)
        .addClass(`article-stat-list-item`)
        .addClass(`border`)
        .append(createSpinner(`12px`))
        .append(doi)
        .onPromise(Article.from(doi), (node, article) => {
            if (!article) return;
            node.clear()
                .append(
                    SF.new(`a`)
                        .setAttribute(`href`, `${getURL()}?doi=${doi}`)
                        .append(article.getTitle())
                )
                .append(
                    SF.new(`div`)
                        .addClass(`article-stat-list-item-info`)
                        .append(`Published ${article.getYear()}   |   `)
                        .append(`${article.getCitationCountEst()} citations`)
                );
        });

const showArticleCurrent = function () {
    SF.query(`#article-info-title`).clear().append(currentArticle.getTitle());
    SF.query(`#article-info-author`)
        .clear()
        .append(currentArticle.getAuthors().join(`     `));

    SF.query(`#article-access`).setAttribute(`href`, currentArticle.getURL());

    SF.query(`#article-details-table`)
        .clear()
        .append(tableRow(`Year`, `${currentArticle.getYear()}`))
        .append(tableRow(`Published in`, `${currentArticle.getSource()}`))
        .append(tableRow(`Publisher`, `${currentArticle.getPublisher()}`))
        .append(tableRow(`Volume`, `${currentArticle.getVolume()}`))
        .append(tableRow(`Issue`, `${currentArticle.getIssue()}`))
        .append(tableRow(`Page`, `${currentArticle.getPage()}`));

    SF.query(`#article-cite-plain`).callEvent(`click`);

    SF.query(`#article-stat-reference`)
        .query(`.article-stat-title`)
        .clear()
        .append(`References`);

    SF.query(`#article-stat-reference`)
        .query(`.article-stat-list`)
        .clear()
        .append(createSpinner(`12px`))
        .onPromise(currentArticle.getReferences(), (node, dois) => {
            node.parent()
                .query(`.article-stat-title`)
                .clear()
                .append(`References (${dois.length})`);
            node.clear();
            slowForEach(dois, 10, (doi) => node.append(createPreview(doi)));
        });

    SF.query(`#article-stat-citation`)
        .query(`.article-stat-title`)
        .clear()
        .append(`Citations`);

    SF.query(`#article-stat-citation`)
        .query(`.article-stat-list`)
        .clear()
        .append(createSpinner(`12px`))
        .onPromise(currentArticle.getCitations(), (node, dois) => {
            node.parent()
                .query(`.article-stat-title`)
                .clear()
                .append(`Citations (${dois.length})`);
            node.clear();
            slowForEach(dois, 10, (doi) => node.append(createPreview(doi)));
        });

    SF.query(`#home-section`).setStyle(`display`, `none`);
    SF.query(`#msg-section`).setStyle(`display`, `none`);
    SF.query(`#article-section`).setStyle(`display`, `block`);
};

const showArticleSearching = function () {
    SF.query(`#msg-section`).clear().append(createSpinner(`20px`));

    SF.query(`#home-section`).setStyle(`display`, `none`);
    SF.query(`#msg-section`).setStyle(`display`, `block`);
    SF.query(`#article-section`).setStyle(`display`, `none`);
};

const showArticleNotFound = function () {
    SF.query(`#msg-section`).clear().append(`article not found`);

    SF.query(`#home-section`).setStyle(`display`, `none`);
    SF.query(`#msg-section`).setStyle(`display`, `block`);
    SF.query(`#article-section`).setStyle(`display`, `none`);
};

const showArticleNone = function () {
    SF.query(`#home-section`).setStyle(`display`, `flex`);
    SF.query(`#msg-section`).setStyle(`display`, `none`);
    SF.query(`#article-section`).setStyle(`display`, `none`);
};

const search = async function (doi) {
    showArticleSearching();
    currentArticle = await Article.from(doi);
    if (currentArticle) showArticleCurrent();
    else showArticleNotFound();
    window.history.replaceState({}, ``, `${getURL()}?doi=${doi}`);
};

const toggleMinMaxState = function (button, a, b) {
    if (button.children()[0].trim() == `expand`) {
        button
            .clear()
            .append(`collapse`)
            .parent()
            .setStyle(`z-index`, `999`)
            .setStyle(a, `0`)
            .setStyle(b, `0`)
            .setStyle(`margin-${a}`, `0`)
            .setStyle(`margin-${b}`, `0`);
    } else if (button.children()[0].trim() == `collapse`) {
        button
            .clear()
            .append(`expand`)
            .parent()
            .setStyle(`z-index`, `0`)
            .setStyle(a, `50%`)
            .setStyle(b, `50%`)
            .setStyle(`margin-${a}`, `1rem`)
            .setStyle(`margin-${b}`, `1rem`);
    }
};

SF.query(`#doi-search-field`).onEvent(`keypress`, function (_, event) {
    if (event.key === `Enter`)
        SF.query(`#doi-search-button`).callEvent(`click`);
});

SF.query(`#doi-search-button`).onEvent(`click`, (_, __) =>
    search(SF.query(`#doi-search-field`).rawElement().value.trim())
);

SF.query(`#article-cite-plain`).onEvent(`click`, (_, __) =>
    SF.query(`#article-cite-field`)
        .clear()
        .setStyle(`white-space`, `pre-wrap`)
        .append(createSpinner(`12px`))
        .onPromise(currentArticle.asPlaintext(), (node, value) => {
            node.clear().append(value);
        })
);

SF.query(`#article-cite-bib`).onEvent(`click`, (_, __) =>
    SF.query(`#article-cite-field`)
        .clear()
        .setStyle(`white-space`, `pre`)
        .append(createSpinner(`12px`))
        .onPromise(currentArticle.asBibTeX(), (node, value) => {
            node.clear().append(value);
        })
);

SF.query(`#article-cite-ris`).onEvent(`click`, (_, __) =>
    SF.query(`#article-cite-field`)
        .clear()
        .setStyle(`white-space`, `pre`)
        .append(createSpinner(`12px`))
        .onPromise(currentArticle.asRIS(), (node, value) => {
            node.clear().append(value);
        })
);

SF.query(`#article-cite-copy`).onEvent(`click`, (node, _) => {
    const content = SF.query(`#article-cite-field`).getContents();

    if (content != "") {
        navigator.clipboard.writeText(content);
        node.clear().append("copied!");
    } else {
        node.clear().append(createSpinner(`12px`)).append(" loading");
    }
    setTimeout(() => node.clear().append("copy"), 1000);
});

SF.query(`#details-expand`).onEvent(`click`, (node, _) =>
    toggleMinMaxState(node, `right`, `bottom`)
);
SF.query(`#cite-expand`).onEvent(`click`, (node, _) =>
    toggleMinMaxState(node, `left`, `bottom`)
);
SF.query(`#citation-expand`).onEvent(`click`, (node, _) =>
    toggleMinMaxState(node, `right`, `top`)
);
SF.query(`#reference-expand`).onEvent(`click`, (node, _) =>
    toggleMinMaxState(node, `left`, `top`)
);

window.onpageshow = function () {
    SF.query(`#header-link`).setAttribute(`href`, getURL());
    showArticleNone();

    const urlParams = new URLSearchParams(window.location.search);
    const doi = urlParams.get(`doi`);
    if (doi != null) {
        SF.query(`#doi-search-field`).rawElement().value = doi;
        SF.query(`#doi-search-button`).callEvent(`click`);
    }
};
