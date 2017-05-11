/**
 * Pure JavaScript implementation of zoom.js.
 *
 * Original preamble:
 * zoom.js - It's the best way to zoom an image
 * @version v0.0.2
 * @link https://github.com/fat/zoom.js
 * @license MIT
 *
 * This is a fork of the original zoom.js implementation by @nishanths & @fat.
 * Copyrights for the original project are held by @fat. 
 * Copyright (c) 2013 @fat
 */

class ZoomJS extends HTMLElement {

    constructor() {
        super();
        this.zoom = this.firstElementChild;  // Img node
        this.offset = 80; 
        this.zoomEvents = {
            zoomOutHandler: () => this.zoomOut.call(this.zoom),
            keyUp: e => {
                if (e.keyCode == 27) this.zoomEvents.zoomOutHandler();
            },
            handleTouchStart: e => {
                let initialTouchPos = -1;
                const t = e.touches[0];
                initialTouchPos = t.pageY;
                e.target.addEventListener("touchmove", e => this.zoomEvents.handleTouchMove(e, initialTouchPos));
            },
            handleTouchMove: (e, i) => {
                const t = e.touches[0];
                if (Math.abs(t.pageY - i) > 10) {
                    this.zoomEvents.zoomOutHandler();
                    e.target.removeEventListener("touchmove", this);
                }
            }
        };
    }
    connectedCallback() {
        if (this.zoom) {
            this.zoom.style.cursor = "zoom-in";
            this.addEventListener("click", e => {
                if (e.metaKey || e.ctrlKey) {
                    window.open(e.target.src);
                    return this.connectedCallback();
                }
                if (e.target.width >= document.documentElement.clientWidth - this.offset) {
                    return Error("Image exceeds screen width");
                }
                this.zoomIn.call(this.zoom);
                this.zoomListeners();
                return "zoomed";
            }, { once: true });
        }
    }
    zoomIn() {
        this.preservedTransform = this.style.transform;
        const scale = (() => {
            const maxScaleFactor = this.naturalWidth / this.width;
            const viewportWidth = document.documentElement.clientWidth - this.parentElement.offset;
            const viewportHeight = document.documentElement.clientHeight - this.parentElement.offset;
            const imageAspectRatio = this.naturalWidth / this.naturalHeight;
            const viewportAspectRatio = viewportWidth / viewportHeight;

            if (this.naturalWidth < viewportWidth && this.naturalHeight < viewportHeight) {
                return maxScaleFactor;
            } else if (imageAspectRatio < viewportAspectRatio) {
                return (viewportHeight / this.naturalHeight) * maxScaleFactor;
            } else {
                return (viewportWidth / this.naturalWidth) * maxScaleFactor;
            }
        })();

        const imageOffset = (() => {
            const rect = this.getBoundingClientRect();
            return {
                top: rect.top + window.pageYOffset - document.documentElement.clientTop,
                left: rect.left + window.pageXOffset - document.documentElement.clientLeft
            };
        })();

        Object.assign(this.parentElement.style, {
            display: "block",
            transition: "all 300ms"
        });

        Object.assign(this.style, {
            outline: "100vw solid transparent",
            transition: "all 300ms",
            pointerEvents: "auto",
            cursor: "zoom-out"
        });
        Object.assign(document.body.style, {
            pointerEvents: "none"
        });

        (( /*animate*/ ) => {
            const scrollTop = window.pageYOffset;
            const viewportX = (document.documentElement.clientWidth / 2);
            const viewportY = scrollTop + (document.documentElement.clientHeight / 2);
            const imageCenterX = imageOffset.left + (this.width / 2);
            const imageCenterY = imageOffset.top + (this.height / 2);
            const tx = viewportX - imageCenterX;
            const ty = viewportY - imageCenterY;
            const tz = 0;

            Object.assign(this.parentElement.style, {
                transform: `translate3d(${tx}px, ${ty}px, ${tz}px)`
            });
            Object.assign(this.style, {
                outlineColor: "#fff",
                transform: `scale(${scale})`
            });

        })();
    }

    zoomOut() {
        const sleep = ms =>
            new Promise((resolve) => window.setTimeout(resolve, ms));

        (async function cleanup() {
            Object.assign(this.parentElement.style, {
                transform: `none`
            });
            Object.assign(this.style, {
                outlineColor: "transparent",
                transform: this.preservedTransform
            });

            await sleep(300);

            Object.assign(this.parentElement.style, {
                display: "",
                transition: ""
            });
            Object.assign(this.style, {
                outline: "",
                outlineColor: "",
                transition: "",
                cursor: "zoom-in"
            });

            Object.assign(document.body.style, {
                pointerEvents: "auto"
            });
            this.parentElement.zoomListeners("remove");
            // Restart
            this.parentElement.connectedCallback();

        }).call(this);
    }

    zoomListeners(remove) {
        if (remove) {
            document.removeEventListener("scroll", this.zoomEvents.zoomOutHandler);
            document.removeEventListener("keyup", this.zoomEvents.keyUp);
            document.removeEventListener("touchstart", this.zoomEvents.handleTouchStart);
            document.removeEventListener("click", this.zoomEvents.zoomOutHandler, true);
        } else {
            document.addEventListener("scroll", this.zoomEvents.zoomOutHandler, { once: true });
            document.addEventListener("keyup", this.zoomEvents.keyUp, { once: true });
            document.addEventListener("touchstart", this.zoomEvents.handleTouchStart, { once: true });
            document.addEventListener("click", this.zoomEvents.zoomOutHandler, { capture: true, once: true });
        }
    }
}
customElements.define('zoom-js', ZoomJS);
