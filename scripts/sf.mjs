export const SF = {};

SF.Node = class {
    #rawElement;

    static fromQuery(query) {
        return SF.Node.fromRawElement(document.querySelector(query));
    }

    static fromQueryAll(query) {
        return Array.from(document.querySelectorAll(query))
            .map((element) => SF.Node.fromRawElement(element))
            .filter((node) => node != null);
    }

    static fromTag(tag) {
        let node = new SF.Node();
        node.#rawElement = document.createElement(tag);
        return node;
    }

    static fromRawElement(rawElement) {
        let node = new SF.Node();
        node.#rawElement = rawElement;
        return node;
    }

    clone = function () {
        return SF.Node.fromRawElement(this.rawElement.cloneNode(true));
    };

    getRawElement = function () {
        return this.#rawElement;
    };

    getAttribute = function (attribute) {
        return this.#rawElement.getAttribute(attribute) || ``;
    };

    setAttribute = function (attribute, value) {
        this.#rawElement.setAttribute(attribute, value);
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
        return this.#rawElement.style[style];
    };

    setStyle = function (style, value) {
        this.#rawElement.style[style] = value;
        return this;
    };

    getParent = function () {
        return SF.Node.fromRawElement(this.#rawElement.parentElement);
    };

    getChildren = function () {
        return Array.from(this.#rawElement.childNodes)
            .map((child) =>
                child instanceof HTMLElement
                    ? SF.Node.fromRawElement(child)
                    : child instanceof Text
                    ? child.textContent
                    : null
            )
            .filter((child) => child != null);
    };

    addChild = function (child) {
        child instanceof SF.Node
            ? this.#rawElement.appendChild(child.getRawElement())
            : typeof child == `string`
            ? this.#rawElement.appendChild(document.createTextNode(child))
            : null;
        return this;
    };

    addChildren = function (children) {
        children.map((child) => this.addChild(child));
        return this;
    };

    removeChild = function (child) {
        this.#rawElement.removeChild(child.getRawElement());
        return this;
    };

    clear = function () {
        while (this.#rawElement.firstChild)
            this.#rawElement.removeChild(this.#rawElement.firstChild);
        return this;
    };

    callEvent = function (event) {
        this.#rawElement.dispatchEvent(new Event(event));
        return this;
    };

    onEvent = function (event, callback) {
        this.#rawElement.addEventListener(event, callback);
        return this;
    };

    onPromise = function (promise, callback) {
        promise.then((value) => callback(this, value));
        return this;
    };

    getContents = function () {
        return this.#rawElement.textContent;
    };

    toString = function () {
        return this.#rawElement.outerHTML;
    };
};

SF.query = function (query) {
    return SF.Node.fromQuery(`${query}`);
};
