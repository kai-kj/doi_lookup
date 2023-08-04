const doiUrl = `https://doi.org`;
const crUrl = `https://api.crossref.org/works`;
const ocUrl = `https://opencitations.net/index/api/v1/metadata`;

export class Article {
    #crData;
    #ocData;

    constructor(data) {
        this.#crData = data;
    }

    static from = async function (doi) {
        const crData = await Article.#getCrData(doi);
        return crData ? new Article(crData) : null;
    };

    getShortName = function () {
        return `${this.getAuthors()[0].split(`,`)[0]}${this.getYear()}`;
    };

    getTitle = function () {
        return this.#crData.title[0] || `(unknown)`;
    };

    getAuthors = function () {
        return this.#crData.author.map(
            (author) => `${author.family}, ${author.given}`
        );
    };

    getPublisher = function () {
        return this.#crData.publisher || `(unknown)`;
    };

    getSource = function () {
        return this.#crData[`container-title`] || `(unknown)`;
    };

    getVolume = function () {
        return this.#crData.volume || `(unknown)`;
    };

    getIssue = function () {
        return this.#crData.issue || `(unknown)`;
    };

    getPage = function () {
        return this.#crData.page || `(unknown)`;
    };

    getYear = function () {
        return this.#crData.issued[`date-parts`][0][0] || `(unknown)`;
    };

    getMonth = function () {
        return this.#crData.issued[`date-parts`][0][1] || `(unknown)`;
    };

    getDOI = function () {
        return this.#crData.DOI || ``;
    };

    getURL = function () {
        return `${doiUrl}/${this.#crData.DOI}`;
    };

    getAbstract = function () {
        return this.#crData.abstract || ``;
    };

    getCitationCountEst = function () {
        return this.#crData[`is-referenced-by-count`];
    };

    getCitations = async function () {
        if (!this.#ocData)
            this.#ocData = fetch(`${ocUrl}/${this.getDOI()}`)
                .then((data) => data.json())
                .then((data) => data[0])
                .catch((error) => console.warn(error));

        return (await this.#ocData).citation
            .split(`;`)
            .map((doi) => doi.trim())
            .filter((doi) => doi != ``);
    };

    getReferenceCountEst = function () {
        return this.#crData[`references-count`];
    };

    getReferences = async function () {
        if (!this.#ocData)
            this.#ocData = fetch(`${ocUrl}/${this.getDOI()}`)
                .then((data) => data.json())
                .then((data) => data[0])
                .catch((error) => console.warn(error));

        return (await this.#ocData).reference
            .split(`;`)
            .map((doi) => doi.trim())
            .filter((doi) => doi != ``);
    };

    asPlaintext = async function () {
        return fetch(this.getURL(), {
            headers: { Accept: `text/x-bibliography` },
        }).then((response) => response.text());
    };

    asBibTeX = async function () {
        return fetch(this.getURL(), {
            headers: { Accept: `application/x-bibtex` },
        }).then((response) => response.text());
    };

    asRIS = async function () {
        return fetch(this.getURL(), {
            headers: { Accept: `application/x-research-info-systems` },
        }).then((response) => response.text());
    };

    static #getCrData = async function (doi) {
        try {
            const local = sessionStorage.getItem(`${crUrl}/${doi}`);
            if (local) return JSON.parse(local);
        } catch (error) {
            console.warn(error);
        }

        const remote = await fetch(`${crUrl}/${doi}`)
            .then((data) => data.json())
            .then((data) => data.message)
            .catch((error) => console.warn(error));

        try {
            sessionStorage.setItem(`${crUrl}/${doi}`, JSON.stringify(remote));
        } catch (error) {
            sessionStorage.clear();
        }

        return remote;
    };
}
