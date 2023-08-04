export const SF = {};

SF.Node = class {
    #element;

    constructor(element) {
        this.#element = element;
    }

    query = function (query) {
        return SF.from(this.#element.querySelector(query));
    };

    queryAll = function (query) {
        return Array.from(this.#element.querySelectorAll(query))
            .map((element) => SF.from(element))
            .filter((node) => node != null);
    };

    clone = function () {
        return SF.from(this.element.cloneNode(true));
    };

    rawElement = function () {
        return this.#element;
    };

    getAttribute = function (attribute) {
        return this.#element.getAttribute(attribute) || ``;
    };

    setAttribute = function (attribute, value) {
        this.#element.setAttribute(attribute, value);
        return this;
    };

    setId = function (name) {
        this.setAttribute(`id`, name);
        return this;
    };

    addClass = function (className) {
        this.setAttribute(
            `class`,
            `${this.getAttribute(`class`)} ${className}`.trim()
        );
        return this;
    };

    removeClass = function (className) {
        this.setAttribute(
            `class`,
            this.getAttribute(`class`)
                .replace(className, ``)
                .replace(`  `, ` `)
                .trim()
        );
        return this;
    };

    getStyle = function (style) {
        return this.#element.style[style];
    };

    setStyle = function (style, value) {
        this.#element.style[style] = value;
        return this;
    };

    parent = function () {
        return SF.from(this.#element.parentElement);
    };

    children = function () {
        return Array.from(this.#element.childNodes)
            .map((child) =>
                child instanceof HTMLElement
                    ? SF.from(child)
                    : child instanceof Text
                    ? child.textContent
                    : null
            )
            .filter((child) => child != null);
    };

    append = function (child) {
        child instanceof SF.Node
            ? this.#element.appendChild(child.rawElement())
            : typeof child == `string`
            ? this.#element.appendChild(document.createTextNode(child))
            : null;
        return this;
    };

    appendAll = function (children) {
        children.map((child) => this.append(child));
        return this;
    };

    remove = function (child) {
        this.#element.removeChild(child.rawElement());
        return this;
    };

    clear = function () {
        while (this.#element.firstChild)
            this.#element.removeChild(this.#element.firstChild);
        return this;
    };

    callEvent = function (event) {
        this.#element.dispatchEvent(new Event(event));
        return this;
    };

    onEvent = function (event, callback) {
        this.#element.addEventListener(event, (e) => callback(this, e));
        return this;
    };

    onPromise = function (promise, callback) {
        promise.then((value) => callback(this, value));
        return this;
    };

    getContents = function () {
        return this.#element.textContent;
    };

    toString = function () {
        return this.#element.outerHTML;
    };
};

SF.from = function (element) {
    return new SF.Node(element);
};

SF.new = function (tag) {
    return SF.from(document.createElement(tag));
};

SF.query = function (query) {
    return SF.from(document.querySelector(query));
};

SF.queryAll = function (query) {
    return Array.from(document.querySelectorAll(query))
        .map((element) => SF.from(element))
        .filter((node) => node != null);
};
