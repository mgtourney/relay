/**
 * Custom HTML Element for injecting data into the DOM.
 * @example <td-data type="player.right.rank" hideonerror="#right-player" />
 */
customElements.define("td-data", class extends HTMLElement {

    constructor() {
        super();
        this.type = this.getAttribute("type");
        this.hideOnError = this.getAttribute("hideonerror");
        this.attr = this.getAttribute("attr");
        this.attrEl = this.getAttribute("attrel");

        if (this.attr != null) {
            this.style.display = "none";
        }
    }


    connectedCallback() {
        setInterval(() => this.update(), 200);
    }


    update() {
        const data = parsePath(this.type);
        document.querySelector(this.hideOnError).style.visibility = data == null && this.hideOnError ? "hidden" : "visible";
        if (this.innerText != data && data != null) {
            if (this.attr != null) {
                document.querySelector(this.attrEl).setAttribute(this.attr, data);
            } else {
                this.innerText = data;
            }
        }
    }

});

function parsePath(path, obj=window.overlay) {
    if (path === "") return obj;

    const pathArray = path.split(".");
    for (let i = 0; i < pathArray.length; i++) {
        const pathPart = pathArray[i];
        if (obj[pathPart] == null) {
            return null;
        } else {
            return parsePath(pathArray.slice(i + 1).join("."), obj[pathPart]);
        }
    }
}