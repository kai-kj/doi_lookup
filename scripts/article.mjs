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
        return `${this.getAuthors()[0].split(",")[0]}${this.getYear()}`;
    };

    getTitle = function () {
        return this.#crData.title[0] || "";
    };

    getAuthors = function () {
        return this.#crData.author.map(
            (author) => `${author.family}, ${author.given}`
        );
    };

    getPublisher = function () {
        return this.#crData.publisher || "";
    };

    getSource = function () {
        return this.#crData[`container-title`] || "";
    };

    getVolume = function () {
        return this.#crData.volume || "";
    };

    getIssue = function () {
        return this.#crData.issue || "";
    };

    getPage = function () {
        return this.#crData.page || "";
    };

    getYear = function () {
        return this.#crData.issued[`date-parts`][0][0] || "";
    };

    getMonth = function () {
        return this.#crData.issued[`date-parts`][0][1] || "";
    };

    getDOI = function () {
        return this.#crData.DOI || "";
    };

    getURL = function () {
        return `${doiUrl}/${this.#crData.DOI}`;
    };

    getAbstract = function () {
        return this.#crData.abstract || "";
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
            headers: { Accept: "text/x-bibliography" },
        }).then((response) => response.text());
    };

    asBibtext = async function () {
        return fetch(this.getURL(), {
            headers: { Accept: "application/x-bibtex" },
        }).then((response) => response.text());
    };

    toBibtex() {
        return (
            `@article{${this.getShortName()},\n` +
            `    title = {${this.getTitle()}},\n` +
            `    author = {${this.getAuthors().join(" and ")}},\n` +
            `    journal = {${this.getSource()}},\n` +
            `    publisher = {${this.getPublisher()}},\n` +
            `    volume = {${this.getVolume()}},\n` +
            `    number = {${this.getIssue()}},\n` +
            `    pages = {${this.getPage()}},\n` +
            `    year = {${this.getYear()}},\n` +
            `    month = {${this.getMonth()}},\n` +
            `    abstract = {${this.getAbstract()}},\n` +
            `}`
        );
    }

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
