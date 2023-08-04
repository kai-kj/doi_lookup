const doiUrl = `https://doi.org`;
const crUrl = `https://api.crossref.org/works`;
const ocUrl = `https://opencitations.net/index/api/v1/metadata`;

export const DL = {};

DL.Article = class {
    #crData;
    #ocData;

    constructor(data) {
        this.#crData = data;
    }

    getShortName = function () {
        return `${this.getAuthors()[0].split(`,`)[0]}${this.getYear()}`;
    };

    getTitle = function () {
        return this.#crData.title[0] || `(unknown)`;
    };

    getAuthors = function () {
        return this.#crData.author.map((author) => `${author.family}, ${author.given}`);
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
        const options = { headers: { Accept: `text/x-bibliography` } };
        return fetch(this.getURL(), options).then((response) => response.text());
    };

    asBibTeX = async function () {
        const options = { headers: { Accept: `application/x-bibtex` } };
        return fetch(this.getURL(), options).then((response) => response.text());
    };

    asRIS = async function () {
        const options = { headers: { Accept: `application/x-research-info-systems` } };
        return fetch(this.getURL(), options).then((response) => response.text());
    };
};

const tryLocal = async function (doi) {
    try {
        const data = sessionStorage.getItem(`${crUrl}/${doi}`);
        if (data) return JSON.parse(data);
    } catch (error) {}
    return null;
};

const tryRemote = async function (doi) {
    try {
        const data = await fetch(`${crUrl}/${doi}`)
            .then((data) => data.json())
            .then((data) => data.message)
            .catch((error) => console.warn(error));

        try {
            sessionStorage.setItem(`${crUrl}/${doi}`, JSON.stringify(data));
        } catch (error) {
            sessionStorage.clear();
        }

        return data;
    } catch (error) {
        return null;
    }
};

DL.from = async function (doi) {
    if (!/\S*\/\S*/.test(doi)) return null;

    let data = await tryLocal(doi);
    if (!data) data = await tryRemote(doi);
    if (!data) return null;
    return new DL.Article(data);
};

DL.query = async function (query, page) {
    const url = `${crUrl}?sort=relevance&select=DOI&query=${encodeURI(query)}&offset=${page * 20}`;
    try {
        return await fetch(url)
            .then((response) => response.json())
            .then((response) => response.message.items)
            .then((response) => response.map((r) => r.DOI));
    } catch {
        return [];
    }
};
