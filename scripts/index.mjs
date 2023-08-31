import { DL } from "./dl.mjs";
import { SF } from "./sf.mjs";

const getURL = () => window.location.href.split(`?`)[0];

const encodeTerm = (term) =>
    encodeURI(
        term
            .split(` `)
            .filter((word) => word != ``)
            .join(`+`)
    );

const slowForEach = function (array, time, fn) {
    if (array.length == 0) return;
    fn(array[0]);
    setTimeout(() => slowForEach(array.slice(1), time, fn), time);
};

const tableRow = (key, value) =>
    SF.new(`tr`)
        .append(SF.new(`td`).append(SF.new(`b`).append(key)).setStyle(`white-space`, `nowrap`))
        .append(SF.new(`td`).append(value));

const createSpinner = (size) => SF.new(`div`).addClass(`spinner`).setStyle(`width`, size).setStyle(`height`, size);

const createPreview = (doi) =>
    SF.new(`div`)
        .addClass(`article-preview`)
        .addClass(`border`)
        .append(createSpinner(`12px`))
        .append(doi)
        .onPromise(DL.from(doi), (node, article) => {
            if (!article) return;
            node.clear()
                .append(
                    SF.new(`a`)
                        .setAttribute(`href`, `${getURL()}?term=${encodeTerm(doi)}`)
                        .append(article.getTitle())
                )
                .append(
                    SF.new(`div`)
                        .addClass(`article-preview-info`)
                        .append(`Published ${article.getYear()}   |   `)
                        .append(`${article.getCitationCountEst()} citations`)
                );
        });

const toggleInfoMinMax = function (button, a, b) {
    const ma = `margin-${a}`;
    const mb = `margin-${b}`;
    const sect = button.parent();
    if (button.children()[0].trim() == `expand`) {
        button.clear().append(`collapse`);
        sect.setStyle(`z-index`, `999`).setStyle(a, `0`).setStyle(b, `0`).setStyle(ma, `0`).setStyle(mb, `0`);
    } else if (button.children()[0].trim() == `collapse`) {
        button.clear().append(`expand`);
        sect.setStyle(`z-index`, `0`).setStyle(a, `50%`).setStyle(b, `50%`).setStyle(ma, `0.5rem`).setStyle(mb, `0.5rem`);
    }
};

const showArticle = function (article) {
    SF.query(`#article-header-title`).append(article.getTitle());
    SF.query(`#article-header-author`).append(article.getAuthors().join(`    `));
    SF.query(`#article-header-access`).setAttribute(`href`, article.getURL());
    SF.query(`#article-details-table`)
        .append(tableRow(`Year`, `${article.getYear()}`))
        .append(tableRow(`Published in`, `${article.getSource()}`))
        .append(tableRow(`Publisher`, `${article.getPublisher()}`))
        .append(tableRow(`Volume`, `${article.getVolume()}`))
        .append(tableRow(`Issue`, `${article.getIssue()}`))
        .append(tableRow(`Page`, `${article.getPage()}`))
        .append(tableRow(`DOI`, `${article.getDOI()}`));

    SF.query(`#article-cite-plain`).onEvent(`click`, (_, __) =>
        SF.query(`#article-cite-field`)
            .clear()
            .setStyle(`white-space`, `pre-wrap`)
            .append(createSpinner(`12px`))
            .onPromise(article.asPlaintext(), (node, value) => {
                node.clear().append(value);
            })
    );

    SF.query(`#article-cite-bib`).onEvent(`click`, (_, __) =>
        SF.query(`#article-cite-field`)
            .clear()
            .setStyle(`white-space`, `pre`)
            .append(createSpinner(`12px`))
            .onPromise(article.asBibTeX(), (node, value) => {
                node.clear().append(value);
            })
    );

    SF.query(`#article-cite-ris`).onEvent(`click`, (_, __) =>
        SF.query(`#article-cite-field`)
            .clear()
            .setStyle(`white-space`, `pre`)
            .append(createSpinner(`12px`))
            .onPromise(article.asRIS(), (node, value) => {
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

    SF.query(`#article-cite-plain`).callEvent(`click`);

    SF.query(`#article-references`)
        .query(`.article-preview-list`)
        .append(createSpinner(`12px`))
        .onPromise(article.getReferences(), (node, dois) => {
            node.parent().query(`.article-info-title`).append(` (${dois.length})`);
            node.clear();
            slowForEach(dois, 10, (doi) => node.append(createPreview(doi)));
        });

    SF.query(`#article-citations`)
        .query(`.article-preview-list`)
        .clear()
        .append(createSpinner(`12px`))
        .onPromise(article.getCitations(), (node, dois) => {
            node.parent().query(`.article-info-title`).append(` (${dois.length})`);
            node.clear();
            slowForEach(dois, 10, (doi) => node.append(createPreview(doi)));
        });

    SF.query(`#article-details-expand`).onEvent(`click`, (node, _) => toggleInfoMinMax(node, `right`, `bottom`));
    SF.query(`#article-cite-expand`).onEvent(`click`, (node, _) => toggleInfoMinMax(node, `left`, `bottom`));
    SF.query(`#article-citation-expand`).onEvent(`click`, (node, _) => toggleInfoMinMax(node, `right`, `top`));
    SF.query(`#article-reference-expand`).onEvent(`click`, (node, _) => toggleInfoMinMax(node, `left`, `top`));

    SF.query(`#home-section`).setStyle(`display`, `none`);
    SF.query(`#msg-section`).setStyle(`display`, `none`);
    SF.query(`#search-result-section`).setStyle(`display`, `none`);
    SF.query(`#article-section`).setStyle(`display`, `block`);
};

const showSearchResult = async function (term, page) {
    const results = await DL.query(term, page);
    if (results.length == 0) {
        showMessageNotFound();
        return;
    }

    results.map((doi) => SF.query(`#search-result-section`).children()[0].append(createPreview(doi)));
    SF.query(`#search-result-section`)
        .children()[0]
        .append(
            SF.new(`div`)
                .setId(`search-result-footer`)
                .append(
                    SF.new(`button`)
                        .setId(`search-result-previous`)
                        .append(`<`)
                        .onEvent(`click`, (_, __) => {
                            window.location.href = `${getURL()}?term=${encodeTerm(term)}&page=${Math.max(0, page - 1)}`;
                        })
                )
                .append(
                    SF.new(`button`)
                        .setId(`search-result-next`)
                        .append(`>`)
                        .onEvent(`click`, (_, __) => {
                            window.location.href = `${getURL()}?term=${encodeTerm(term)}&page=${page + 1}`;
                        })
                )
                .append(`page ${page}`)
        );

    SF.query(`#home-section`).setStyle(`display`, `none`);
    SF.query(`#msg-section`).setStyle(`display`, `none`);
    SF.query(`#search-result-section`).setStyle(`display`, `block`);
    SF.query(`#article-section`).setStyle(`display`, `none`);
};

const showMessageSearching = function () {
    SF.query(`#msg-section`).clear().append(createSpinner(`20px`));

    SF.query(`#home-section`).setStyle(`display`, `none`);
    SF.query(`#msg-section`).setStyle(`display`, `block`);
    SF.query(`#search-result-section`).setStyle(`display`, `none`);
    SF.query(`#article-section`).setStyle(`display`, `none`);
};

const showMessageNotFound = function () {
    SF.query(`#msg-section`).clear().append(`article not found`);

    SF.query(`#home-section`).setStyle(`display`, `none`);
    SF.query(`#msg-section`).setStyle(`display`, `block`);
    SF.query(`#search-result-section`).setStyle(`display`, `none`);
    SF.query(`#article-section`).setStyle(`display`, `none`);
};

const showArticleNone = function () {
    SF.query(`#home-section`).setStyle(`display`, `flex`);
    SF.query(`#msg-section`).setStyle(`display`, `none`);
    SF.query(`#search-result-section`).setStyle(`display`, `none`);
    SF.query(`#article-section`).setStyle(`display`, `none`);
};

const search = async function (term, page) {
    showMessageSearching();
    const article = await DL.from(term);
    if (article) showArticle(article);
    else showSearchResult(term, page);
};

SF.query(`#search-bar-field`).onEvent(`keypress`, function (_, event) {
    if (event.key === `Enter`) SF.query(`#search-bar-button`).callEvent(`click`);
});

SF.query(`#search-bar-button`).onEvent(`click`, (_, __) => {
    const input = SF.query(`#search-bar-field`)
        .rawElement()
        .value.split(` `)
        .filter((word) => word != ``)
        .join(`+`);
    if (input != "") window.location.href = `${getURL()}?term=${encodeTerm(input)}`;
});

window.onpageshow = async function () {
    showArticleNone();
    SF.query(`#header-link`).setAttribute(`href`, getURL());
    SF.query(`#search-bar-field`).rawElement().focus();
    SF.query(`#search-bar-field`).rawElement().select();

    const urlParams = new URLSearchParams(window.location.search);
    const term = urlParams.get(`term`);
    if (term != null) {
        let page = urlParams.get(`page`);
        if (page == null) page = `0`;
        search(term, parseInt(page));
    }
};
