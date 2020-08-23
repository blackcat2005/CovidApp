//#region variable
const {remote, ipcRenderer, shell} = require("electron");
const EventEmitter = require("events").EventEmitter;
const fs = require("fs");
let appMain = require("./app");
let isThumbed = false;
const REAL_DATA = __dirname + "/../src/data.json";
const TMP_DATA = __dirname + "/../src/tmp.data.json";
const eventChangeWin = new EventEmitter();
const className = {
    choosenCountry: ".choosen-country ",
    world: ".world ",
    casesNum: ".infor .detail-cases-num ",
    casesNew: ".infor .detail-cases-new",
    activeNum: ".infor .detail-active-num ",
    activeNew: ".infor .detail-active-new ",
    recoverNum: ".infor .detail-recover-num ",
    recoverNew: ".infor .detail-recover-new ",
    deathsNum: ".infor .detail-death-num ",
    deathsNew: ".infor .detail-death-new ",
    list: ".list-view .items",
    btnLast: ".btn-last ",
    vnThumb: ".vn ",
    worldThumb: ".world ",
    caseNumThumb: ".cases .num ",
    caseNewThumb: ".cases .new ",
    recoverNumThumb: ".recovers .num ",
    recoverNewThumb: ".recovers .new ",
    deathNumThumb: ".deaths .num ",
    deathNewThumb: ".deaths .new ",
    mainThumb: ".main-container",
};
let dataCountries;
let countryNameSearch;
let tableType = {
    type: "normal",
    currentTable: 1,
};
//#endregion

//#region build-in func
function formatNumber(number, commaNeed = false) {
    let numberString;
    if (number === null) {
        return "--";
    }
    numberString = Math.abs(number).toString();

    for (let i = numberString.length - 1 - 3; i >= 0; i -= 3) {
        numberString =
            numberString.slice(0, i + 1) + "," + numberString.slice(i + 1);
    }

    if (commaNeed) {
        numberString = (number > 0 ? "+" : number < 0 ? "-" : "") + numberString;
    }

    return numberString;
}

//#endregion

//#region Thumb

//Show thumb hide main win
function setThumb() {
    document.querySelector(".main").style.display = "none";
    document.querySelector(".small-win").style.display = "inline";
}

// init eventListener to transform to main window
function initThumb() {
    document
        .querySelector(".small-win.main-container")
        .addEventListener("click", () => {
            isThumbed = false;
            console.log("Main!");
            eventChangeWin.emit("main");
            ipcRenderer.send("main");
        });
}

function setVNThumb() {
    let dataVN = appMain.getDataVietNam();

    document.querySelector(
        className.vnThumb + className.caseNumThumb
    ).innerText = formatNumber(dataVN.totalCase);
    document.querySelector(
        className.vnThumb + className.caseNewThumb
    ).innerText = formatNumber(dataVN.newCases, true);
    document.querySelector(
        className.vnThumb + className.recoverNumThumb
    ).innerText = formatNumber(dataVN.totalRecovered);
    document.querySelector(
        className.vnThumb + className.recoverNewThumb
    ).innerText = formatNumber(dataVN.newRecovered, true);
    document.querySelector(
        className.vnThumb + className.deathNumThumb
    ).innerText = formatNumber(dataVN.totalDeaths);
    document.querySelector(
        className.vnThumb + className.deathNewThumb
    ).innerText = formatNumber(dataVN.newDeaths, true);
}

function setWorldThumb() {
    let dataWorld = appMain.getDataWorld();

    document.querySelector(
        className.worldThumb + className.caseNumThumb
    ).innerText = formatNumber(dataWorld.totalCase);
    document.querySelector(
        className.worldThumb + className.caseNewThumb
    ).innerText = formatNumber(dataWorld.newCases, true);
    document.querySelector(
        className.worldThumb + className.recoverNumThumb
    ).innerText = formatNumber(dataWorld.totalRecovered);
    document.querySelector(
        className.worldThumb + className.recoverNewThumb
    ).innerText = formatNumber(dataWorld.newRecovered, true);
    document.querySelector(
        className.worldThumb + className.deathNumThumb
    ).innerText = formatNumber(dataWorld.totalDeaths);
    document.querySelector(
        className.worldThumb + className.deathNewThumb
    ).innerText = formatNumber(dataWorld.newDeaths, true);
}

//display data
function displayThumb() {
    setVNThumb();
    setWorldThumb();
}

//#endregion

//#region main win

function setSizeContent() {
    let mainContainer = document.querySelector(".main-container");
    let dashboard = document.querySelector(".dashboard");
    let thumb = document.querySelector(".thumb");
    let choosenBox = document.querySelector(".choosen-country");
    let worldBox = document.querySelector(".world");

    //size container
    let widthContain = mainContainer.offsetWidth;
    let heightContain = mainContainer.offsetHeight;

    //Set height
    let heightDashboard = heightContain - 80;
    let heightThumb = heightDashboard;
    let heightVn, heightWorld;
    heightVn = heightWorld = (heightThumb - 23) / 2;
    dashboard.style.height = heightDashboard + "px";
    thumb.style.height = heightThumb + "px";
    choosenBox.style.height = heightVn + "px";
    worldBox.style.height = heightWorld + "px";

    //Set width
    let widthDashboard = (widthContain - 80) * 0.55 - 23;
    let widthThumb = widthContain - widthDashboard - 23 - 80;
    let widthVn, widthWorld;
    widthVn = widthWorld = widthThumb;
    dashboard.style.width = widthDashboard + "px";
    thumb.style.width = widthThumb + "px";
    choosenBox.style.width = widthVn + "px";
    worldBox.style.width = widthWorld + "px";

    thumb.style.margin = "auto 40px auto auto";
    dashboard.style.margin = "auto auto auto 40px";
}

function setTheme(type = "dark") {
    if ((type = "dark")) {
    } else if ((type = "light")) {
    }
}

function setFuncTitle() {
    document
        .getElementsByClassName("minimize-win")[0]
        .addEventListener("click", () => {
            let loading = document.getElementsByClassName("loading")[0].style.display;
            if (loading !== "") {
                ipcRenderer.send("thumb");
                console.log("Thumbed!");
                isThumbed = true;
                eventChangeWin.emit("thumb");
            }
        });

    document
        .getElementsByClassName("close-win")[0]
        .addEventListener("click", () => {
            appMain.clearFile();
            remote.app.quit();
        });

    document
        .getElementsByClassName("setting-button")[0]
        .addEventListener("click", () => {
            remote.getCurrentWindow().toggleDevTools();
        });

    document
        .getElementsByClassName("maximize-win")[0]
        .addEventListener("click", () => {
            const current = remote.getCurrentWindow();
            if (current.isMaximized()) {
                current.restore();
                console.log("restore");
            } else {
                console.log("max");
                current.maximize();
            }
        });
}

//show main hide thumb
function setMain() {
    document.querySelector(".main").style.display = "inline";
    document.querySelector(".small-win").style.display = "none";
}

//init property window
function initMain() {
    setSizeContent();
    setFuncTitle();
    setTheme();
    document.querySelector(".small-win").style.display = "none";
    remote.getCurrentWindow().on("resize", setSizeContent);
}

function setByCountry(CountryName) {
    let dataCountry = appMain.getDataByCountry(CountryName);

    document.querySelector(
        className.choosenCountry + " .heading"
    ).innerText = CountryName;
    document.querySelector(
        className.choosenCountry + className.casesNum
    ).innerText = formatNumber(dataCountry.totalCase);
    document.querySelector(
        className.choosenCountry + className.casesNew
    ).innerText = formatNumber(dataCountry.newCases, true);
    document.querySelector(
        className.choosenCountry + className.activeNum
    ).innerText = formatNumber(dataCountry.totalActive);
    document.querySelector(
        className.choosenCountry + className.activeNew
    ).innerText = formatNumber(dataCountry.newActive, true);
    document.querySelector(
        className.choosenCountry + className.recoverNum
    ).innerText = formatNumber(dataCountry.totalRecovered);
    document.querySelector(
        className.choosenCountry + className.recoverNew
    ).innerText = formatNumber(dataCountry.newRecovered, true);
    document.querySelector(
        className.choosenCountry + className.deathsNum
    ).innerText = formatNumber(dataCountry.totalDeaths);
    document.querySelector(
        className.choosenCountry + className.deathsNew
    ).innerText = formatNumber(dataCountry.newDeaths, true);
}

function setVNMain() {
    setByCountry("Vietnam");
    document.querySelector(".choosen-country").addEventListener("click", () => {
        setByCountry("Vietnam");
    });
}

function setUpdateTime() {
    let updateTime = appMain.getUpdateTime();

    document.querySelectorAll(".lasttime-updated").forEach((e) => {
        e.innerText = "Update at : " + updateTime;
    });
}

function setWorldMain() {
    let dataWorld = appMain.getDataWorld();

    document.querySelector(
        className.world + className.casesNum
    ).innerText = formatNumber(dataWorld.totalCase);
    document.querySelector(
        className.world + className.casesNew
    ).innerText = formatNumber(dataWorld.newCases, true);
    document.querySelector(
        className.world + className.activeNum
    ).innerText = formatNumber(dataWorld.totalActive);
    document.querySelector(
        className.world + className.activeNew
    ).innerText = formatNumber(dataWorld.newActive, true);
    document.querySelector(
        className.world + className.recoverNum
    ).innerText = formatNumber(dataWorld.totalRecovered);
    document.querySelector(
        className.world + className.recoverNew
    ).innerText = formatNumber(dataWorld.newRecovered, true);
    document.querySelector(
        className.world + className.deathsNum
    ).innerText = formatNumber(dataWorld.totalDeaths);
    document.querySelector(
        className.world + className.deathsNew
    ).innerText = formatNumber(dataWorld.newDeaths, true);
}

function displayTable(source, countryName = "") {
    dataCountries = appMain.data.global.countries;
    document.querySelector(className.list).innerHTML = "";
    let type = tableType.type;
    let tableIndex;
    if (type === "normal") {
        tableIndex = appMain.getTablesNormal(10);
    } else if (type === "search") {
        tableIndex = appMain.getTableSearch(countryName, 10);
    } else {
    }
    document.querySelector(className.btnLast).textContent =
        tableIndex.numberTable;
    for (
        let i = tableIndex.tables[tableType.currentTable - 1][0];
        i <= tableIndex.tables[tableType.currentTable - 1][1];
        i++
    ) {
        let element = document.createElement("div");
        let newHTML =
            '<span class="cell-design">%index%</span><span class="cell-design">%name%</span><span class="cell-design">%cases%</span><span class="cell-design">%recover%</span><span class="cell-design">%death%</span>';
        newHTML = newHTML
            .replace("%index%", source[i].index)
            .replace("%name%", source[i].country)
            .replace("%cases%", formatNumber(source[i].totalCase))
            .replace("%recover%", formatNumber(source[i].totalRecovered))
            .replace("%death%", formatNumber(source[i].totalDeaths));
        element.innerHTML = newHTML;
        element.classList.add("item");
        element.setAttribute("data-name", source[i].country);
        element.setAttribute("data-id", source[i].index);
        element.setAttribute("id", source[i].index);
        element.classList.add("row-design");
        document.querySelector(className.list).appendChild(element);
    }
}

//Set element in table eventListener when click on
function setElementFunc() {
    document.getElementsByClassName("items")[0].childNodes.forEach((e) => {
        e.addEventListener("click", () => {
            setByCountry(e.dataset.name);
        });
    });
}

function displayTableNormal() {
    tableType.type = "normal";
    displayTable(dataCountries);
    setElementFunc();
}

function displayTableSearch(countryName) {
    tableType.type = "search";
    let source = appMain.getDataByCountryStart(countryName);
    displayTable(source, countryName);
    setElementFunc();
}

function setFuncBtnNavi() {
    document.querySelector(".btn-previous").addEventListener("click", () => {
        tableType.currentTable =
            tableType.currentTable === 1 ? 1 : tableType.currentTable - 1;
        if (tableType.type === "normal") {
            displayTableNormal();
        } else if (tableType.type === "search") {
            displayTableSearch(countryNameSearch);
        }
    });

    document.querySelector(".btn-fir").addEventListener("click", () => {
        tableType.currentTable = 1;
        if (tableType.type === "normal") {
            displayTableNormal();
        } else if (tableType.type === "search") {
            displayTableSearch(countryNameSearch);
        }
    });
    document.querySelector(".btn-sec").addEventListener("click", () => {
        let tableIndex;
        if (tableType.type === "normal") {
            tableIndex = appMain.getTablesNormal(10);
        } else if (tableType.type === "search") {
            tableIndex = appMain.getTableSearch(countryNameSearch, 10);
        }

        if (tableIndex.numberTable >= 2) {
            tableType.currentTable = 2;
            if (tableType.type === "normal") {
                displayTableNormal();
            } else if (tableType.type === "search") {
                displayTableSearch(countryNameSearch);
            }
        }
    });

    document.querySelector(".btn-last").addEventListener("click", () => {
        let tableIndex;
        if (tableType.type === "normal") {
            tableIndex = appMain.getTablesNormal(10);
        } else if (tableType.type === "search") {
            tableIndex = appMain.getTableSearch(countryNameSearch, 10);
        }
        tableType.currentTable = tableIndex.numberTable;
        console.log(tableType);
        if (tableType.type === "normal") {
            displayTableNormal();
        } else if (tableType.type === "search") {
            displayTableSearch(countryNameSearch);
        }
    });

    document.querySelector(".btn-next").addEventListener("click", () => {
        let tableIndex;
        if (tableType.type === "normal") {
            tableIndex = appMain.getTablesNormal(10);
        } else if (tableType.type === "search") {
            tableIndex = appMain.getTableSearch(countryNameSearch, 10);
        }
        tableType.currentTable =
            tableType.currentTable === tableIndex.numberTable
                ? tableIndex.numberTable
                : tableType.currentTable + 1;
        if (tableType.type === "normal") {
            displayTableNormal();
        } else if (tableType.type === "search") {
            displayTableSearch(countryNameSearch);
        }
    });
}

function setFuncSearchBox() {
    document.querySelector(".search-box").addEventListener("keyup", () => {
        countryNameSearch = document.querySelector(".search-box").value;
        tableType.currentTable = 1;
        if (countryNameSearch !== "") {
            displayTableSearch(countryNameSearch);
        } else {
            displayTableNormal();
        }
    });
}

function setFuncSource() {
    document.querySelector(".source > a > em").addEventListener("click", (e) => {
        let link = e.target.innerHTML;
        shell.openExternal("https:/" + link).then(() => {
            e.preventDefault();
        });
    });
    document.querySelector(".source").addEventListener("click", (e) => {
        e.preventDefault();
    });
}

function setFunc() {
    setFuncBtnNavi();
    setFuncSearchBox();
    setFuncSource();
}

//init property content
function initContent() {
    setSizeContent();
    dataCountries = appMain.data.global.countries;
    setWorldMain();
    setVNMain();
    setUpdateTime();
    setFunc();
    displayTableNormal();
}

function endLoading() {
    document.querySelector(".loading ").style.display = "none";
    document.querySelector(".main-container ").style.display = "flex";
}

//display data main
function displayMain() {
    setWorldMain();
    setVNMain();
    setUpdateTime();
    if (tableType.type === "normal") {
        displayTableNormal();
    } else if (tableType.type === "search") {
        displayTableSearch(countryNameSearch);
    }
}

function displayData() {
    console.log("Event change ui");
    dataCountries = appMain.data.global.countries;
    displayMain();
    displayThumb();
}

//#endregion

initMain();

appMain
    .first()
    .then((data) => {
        appMain.clearFile();
        fs.writeFileSync(TMP_DATA, JSON.stringify(data));
        fs.writeFileSync(REAL_DATA, JSON.stringify(data));
        appMain.data = JSON.parse(fs.readFileSync(REAL_DATA).toString());
        dataCountries = appMain.data.global.countries;
        endLoading();
        displayMain();
        initContent();
        appMain.start();
        appMain.eventChange.on("changed", () => {
            displayData();
        });
        eventChangeWin.on("main", () => {
            setMain();
        });
        eventChangeWin.on("thumb", () => {
            setThumb();
            initThumb();
            displayThumb();
        });
    })
    .catch((err) => {
        document.querySelector(".loading-error-text").style.display = "block";
        console.log(err);
    });
