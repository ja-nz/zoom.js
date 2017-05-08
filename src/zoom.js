/**
 * Pure JavaScript implementation of zoom.js.
 *
 * Original preamble:
 * zoom.js - It's the best way to zoom an image
 * @version v0.0.2
 * @link https://github.com/fat/zoom.js
 * @license MIT
 *
 * Needs a related CSS file to work. See the README at
 * https://github.com/nishanths/zoom.js for more info.
 *
 * This is a fork of the original zoom.js implementation by @fat.
 * Copyrights for the original project are held by @fat. All other copyright
 * for changes in the fork are held by Nishanth Shanmugham.
 *
 * Copyright (c) 2013 @fat
 * The MIT License. Copyright © 2016 Nishanth Shanmugham.
 */

var current = null;
var offset = 80;
var initialScrollPos = -1;
var initialTouchPos = -1;
var windowWidth =  document.documentElement.clientWidth;

var elemOffset = elem => {
    var rect = elem.getBoundingClientRect();
    var docElem = document.documentElement;
    var win = window;
    return {
        top: rect.top + win.pageYOffset - docElem.clientTop,
        left: rect.left + win.pageXOffset - docElem.clientLeft
    };
};

var once = (elem, type, handler) => {
    var fn = e => {
        e.target.removeEventListener(type, fn);
        handler();
    };
    elem.addEventListener(type, fn);
};

class Size {
    constructor(w, h) {
        this.w = w;
        this.h = h;
    }
}

class ZoomImage {
    constructor(img, offset) {
        this.img = img;
        this.preservedTransform = img.style.transform;
        this.wrap = null;
        this.overlay = null;
        this.offset = offset;
        this.windowWidth = document.documentElement.clientWidth;
        this.windowHeight = document.documentElement.clientHeight;
    }

    forceRepaint() {
        var _ = this.img.offsetWidth; 
        return;
    }

    zoom() {
        var size = new Size(this.img.naturalWidth, this.img.naturalHeight);

        this.wrap = document.createElement("div");
        this.wrap.classList.add("zoom-img-wrap");
        this.img.parentNode.insertBefore(this.wrap, this.img);
        this.wrap.appendChild(this.img);

        this.img.classList.add("zoom-img");
        this.img.setAttribute("data-action", "zoom-out");

        this.overlay = document.createElement("div");
        this.overlay.classList.add("zoom-overlay");
        document.body.appendChild(this.overlay);

        this.forceRepaint();
        var scale = this.calculateScale(size);

        this.forceRepaint();
        this.animate(scale);

        document.body.classList.add("zoom-overlay-open");
    }

    calculateScale(size) {
        var maxScaleFactor = size.w / this.img.width;

        var viewportWidth = (this.windowWidth - this.offset);
        var viewportHeight = (this.windowHeight - this.offset);
        var imageAspectRatio = size.w / size.h;
        var viewportAspectRatio = viewportWidth / viewportHeight;

        if (size.w < viewportWidth && size.h < viewportHeight) {
            return maxScaleFactor;
        } else if (imageAspectRatio < viewportAspectRatio) {
            return (viewportHeight / size.h) * maxScaleFactor;
        } else {
            return (viewportWidth / size.w) * maxScaleFactor;
        }
    }

    animate(scale) {
        var imageOffset = elemOffset(this.img);
        var scrollTop = window.pageYOffset;

        var viewportX = (this.windowWidth / 2);
        var viewportY = scrollTop + (this.windowHeight / 2);

        var imageCenterX = imageOffset.left + (this.img.width / 2);
        var imageCenterY = imageOffset.top + (this.img.height / 2);

        var tx = viewportX - imageCenterX;
        var ty = viewportY - imageCenterY;
        var tz = 0;

        var imgTr = `scale(${scale})`;
        var wrapTr = `translate3d(${tx}px, ${ty}px, ${tz}px)`;

        this.img.style.transform = imgTr;
        this.wrap.style.transform = wrapTr;
    }

    dispose() {
        if (this.wrap == null || this.wrap.parentNode == null) {
            return;
        }
        this.img.classList.remove("zoom-img");
        this.img.setAttribute("data-action", "zoom");

        this.wrap.parentNode.insertBefore(this.img, this.wrap);
        this.wrap.parentNode.removeChild(this.wrap);

        document.body.removeChild(this.overlay);
        document.body.classList.remove("zoom-overlay-transitioning");
    }

    close() {
        document.body.classList.add("zoom-overlay-transitioning");
        this.img.style.transform = this.preservedTransform;
        if (this.img.style.length === 0) {
            this.img.removeAttribute("style");
        }
        this.wrap.style.transform = "none";

        once(this.img, "transitionend", () => {
            this.dispose();
            // XXX(nishanths): remove class should happen after dispose. Otherwise,
            // a new click event could fire and create a duplicate ZoomImage for
            // the same <img> element.
            document.body.classList.remove("zoom-overlay-open");
        });
    }
}


// Setup code

var setup = (elem) => {
    elem.addEventListener("click", prepareZoom);
};

var prepareZoom = e => {
    if (document.body.classList.contains("zoom-overlay-open")) {
        return;
    }

    if (e.metaKey || e.ctrlKey) {
        window.open((e.target.getAttribute("data-original") || e.target.src), "_blank");
        return;
    }

    if (e.target.width >= windowWidth - offset) {
        return;
    }

    closeCurrent(true);

    current = new ZoomImage(e.target, offset);
    current.zoom();

    addCloseListeners();
};

var closeCurrent = force => {
    if (current == null) {
        return;
    }
    if (force) {
        current.dispose();
    } else {
        current.close();
    }
    removeCloseListeners();
    current = null;
};

var addCloseListeners = () => {
    document.addEventListener("scroll", handleScroll);
    document.addEventListener("keyup", handleKeyup);
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("click", handleClick, true);
};

var removeCloseListeners = () => {
    document.removeEventListener("scroll", handleScroll);
    document.removeEventListener("keyup", handleKeyup);
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("click", handleClick, true);
};

var handleScroll = () => {
    if (initialScrollPos == -1) {
        initialScrollPos = window.pageYOffset;
    }

    var deltaY = Math.abs(initialScrollPos - window.pageYOffset);
    if (deltaY >= 40) {
        closeCurrent();
    }
};

var handleKeyup = e => {
    if (e.keyCode == 27) {
        closeCurrent();
    }
};

var handleTouchStart = e => {
    var t = e.touches[0];
    if (t == null) {
        return;
    }

    initialTouchPos = t.pageY;
    e.target.addEventListener("touchmove", handleTouchMove);
};

var handleTouchMove = e => {
    var t = e.touches[0];
    if (t == null) {
        return;
    }

    if (Math.abs(t.pageY - initialTouchPos) > 10) {
        closeCurrent();
        e.target.removeEventListener("touchmove", handleTouchMove);
    }
};

var handleClick = () => {
    closeCurrent();
};

var zoom = Object.create(null);
zoom.setup = setup;

export { zoom };
