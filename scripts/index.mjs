/*
    10.1016/j.imavis.2005.02.004
*/

import { Article } from "./article.mjs";
import { SF } from "./sf.mjs";

let currentArticle = undefined;

const getURL = () => window.location.href.split(`?`)[0];

const tableRow = (key, value) =>
    SF.Node.fromTag(`tr`)
        .addChild(
            SF.Node.fromTag(`td`)
                .addChild(SF.Node.fromTag(`b`).addChild(key))
                .setStyle(`white-space`, `nowrap`)
        )
        .addChild(SF.Node.fromTag(`td`).addChild(value));

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
    SF.query(`#article-info-title`).clear().addChild(currentArticle.getTitle());
    SF.query(`#article-info-author`)
        .clear()
        .addChild(currentArticle.getAuthors().join(`     `));

    SF.query(`#article-details-table`)
        .clear()
        .addChild(tableRow(`Year`, `${currentArticle.getYear()}`))
        .addChild(tableRow(`Published in`, `${currentArticle.getSource()}`))
        .addChild(tableRow(`Publisher`, `${currentArticle.getPublisher()}`))
        .addChild(tableRow(`Volume`, `${currentArticle.getVolume()}`))
        .addChild(tableRow(`Issue`, `${currentArticle.getIssue()}`))
        .addChild(tableRow(`Page`, `${currentArticle.getPage()}`));

    SF.query(`#article-cite-plain`).callEvent(`click`);

    SF.query(`#article-stat-ref`)
        .clear()
        .addChild(createSpinner(`12px`))
        .onPromise(currentArticle.getReferences(), (node, dois) =>
            node.clear().addChildren(dois.map((doi) => createPreview(doi)))
        );

    SF.query(`#article-stat-cit`)
        .clear()
        .addChild(createSpinner(`12px`))
        .onPromise(currentArticle.getCitations(), (node, dois) =>
            node.clear().addChildren(dois.map((doi) => createPreview(doi)))
        );

    SF.query(`#article-section`).setStyle(`display`, `block`);
    SF.query(`#msg-section`).setStyle(`display`, `none`);
};

const showArticleSearching = function () {
    SF.query(`#msg-section`).clear().addChild(createSpinner(`20px`));
    SF.query(`#article-section`).setStyle(`display`, `none`);
    SF.query(`#msg-section`).setStyle(`display`, `block`);
};

const showArticleNotFound = function () {
    SF.query(`#msg-section`).clear().addChild(`article not found`);
    SF.query(`#article-section`).setStyle(`display`, `none`);
    SF.query(`#msg-section`).setStyle(`display`, `block`);
};

const showArticleNone = function () {
    SF.query(`#article-section`).setStyle(`display`, `none`);
    SF.query(`#msg-section`).setStyle(`display`, `none`);
};

const search = async function (doi) {
    showArticleSearching();
    currentArticle = await Article.from(doi);
    if (currentArticle) showArticleCurrent();
    else showArticleNotFound();
    window.history.replaceState({}, ``, `${getURL()}?doi=${doi}`);
};

const toggleMinMaxState = function (button, a, b) {
    if (button.getChildren()[0].trim() == `expand`) {
        button
            .clear()
            .addChild(`collapse`)
            .getParent()
            .setStyle(`z-index`, `999`)
            .setStyle(a, `0`)
            .setStyle(b, `0`)
            .setStyle(`margin-${a}`, `0`)
            .setStyle(`margin-${b}`, `0`);
    } else if (button.getChildren()[0].trim() == `collapse`) {
        button
            .clear()
            .addChild(`expand`)
            .getParent()
            .setStyle(`z-index`, `0`)
            .setStyle(a, `50%`)
            .setStyle(b, `50%`)
            .setStyle(`margin-${a}`, `1rem`)
            .setStyle(`margin-${b}`, `1rem`);
    }
};

SF.query(`#doi-search-field`).onEvent(`keypress`, function (event) {
    if (event.key === `Enter`)
        SF.query(`#doi-search-button`).callEvent(`click`);
});

SF.query(`#doi-search-button`).onEvent(`click`, (_) =>
    search(SF.query(`#doi-search-field`).getRawElement().value.trim())
);

SF.query(`#article-access`).onEvent(`click`, (_) =>
    window.open(currentArticle.getURL())
);

SF.query(`#article-cite-plain`).onEvent(`click`, (_) =>
    SF.query(`#article-cite-field`)
        .clear()
        .setStyle(`white-space`, `pre-wrap`)
        .addChild(createSpinner(`12px`))
        .onPromise(currentArticle.asPlaintext(), (node, value) => {
            node.clear().addChild(value);
        })
);

SF.query(`#article-cite-bib`).onEvent(`click`, (_) =>
    SF.query(`#article-cite-field`)
        .clear()
        .setStyle(`white-space`, `pre`)
        .addChild(createSpinner(`12px`))
        .onPromise(currentArticle.asBibTeX(), (node, value) => {
            node.clear().addChild(value);
        })
);

SF.query(`#article-cite-ris`).onEvent(`click`, (_) =>
    SF.query(`#article-cite-field`)
        .clear()
        .setStyle(`white-space`, `pre`)
        .addChild(createSpinner(`12px`))
        .onPromise(currentArticle.asRIS(), (node, value) => {
            node.clear().addChild(value);
        })
);

SF.query(`#article-cite-copy`).onEvent(`click`, (_) => {
    const content = SF.query(`#article-cite-field`).getContents();

    if (content != "") {
        navigator.clipboard.writeText(content);
        SF.query(`#article-cite-copy`).clear().addChild("copied!");
    } else {
        SF.query(`#article-cite-copy`)
            .clear()
            .addChild(createSpinner(`12px`))
            .addChild(" loading");
    }
    setTimeout(
        () => SF.query(`#article-cite-copy`).clear().addChild("copy"),
        1000
    );
});

SF.query(`#details-expand`).onEvent(`click`, (_) =>
    toggleMinMaxState(SF.query(`#details-expand`), `right`, `bottom`)
);
SF.query(`#cite-expand`).onEvent(`click`, (_) =>
    toggleMinMaxState(SF.query(`#cite-expand`), `left`, `bottom`)
);
SF.query(`#citation-expand`).onEvent(`click`, (_) =>
    toggleMinMaxState(SF.query(`#citation-expand`), `right`, `top`)
);
SF.query(`#reference-expand`).onEvent(`click`, (_) =>
    toggleMinMaxState(SF.query(`#reference-expand`), `left`, `top`)
);

window.onpageshow = function () {
    SF.query(`#header-link`).href = getURL();
    showArticleNone();

    const urlParams = new URLSearchParams(window.location.search);
    const doi = urlParams.get(`doi`);
    if (doi != null) {
        SF.query(`#doi-search-field`).getRawElement().value = doi;
        SF.query(`#doi-search-button`).callEvent(`click`);
    }
};
