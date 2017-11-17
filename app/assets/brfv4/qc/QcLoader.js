var loader = { queuePreloader: null };



loader.preload = function (filesToLoad, callback) {

    if (loader.queuePreloader !== null || !filesToLoad) {
        return;
    }

    function onPreloadProgress(event) {
        loader.setProgressBar(event.loaded, true);
    }

    function onPreloadComplete(event) {
        loader.setProgressBar(1.0, false);
        if (callback) callback();
    }

    var queue = loader.queuePreloader = new createjs.LoadQueue(true);
    queue.on("progress", onPreloadProgress);
    queue.on("complete", onPreloadComplete);
    queue.loadManifest(filesToLoad, true);
};



loader.setProgressBar = function (percent, visible) {

    var bar = document.getElementById("_progressBar");
    if (!bar) return;

    if (percent < 0.0) percent = 0.0;
    if (percent > 1.0) percent = 1.0;

    var width = Math.round(percent * 640);
    var color = 0xe7e7e7;

    bar.style.width = width + "px";
    bar.style.backgroundColor = "#" + color.toString(16);
    bar.style.display = visible ? "block" : "none";
};	