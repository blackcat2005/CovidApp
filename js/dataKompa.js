const fetch = require("node-fetch");
const fs = require("fs");
const schedule = require("node-schedule");
const EventEmitter = require("events").EventEmitter;
const event = new EventEmitter();

const REAL_DATA = __dirname + "/../src/data.json";
const TMP_DATA = __dirname + "/../src/tmp.data.json";
const CRAWLER_TIME = 1;

const baseUri = "https://corona-api.kompa.ai/graphql";
const fetchCountriesDataParam = {
  credentials: "omit",
  headers: {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9,vi;q=0.8",
    "content-type": "application/json",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    origin: "https://corona.kompa.ai",
    referrer: "https://corona.kompa.ai/analytics",
    referrerPolicy: "no-referrer-when-downgrade",
  },
  body:
      '{"operationName":null,"variables":{},"query":"{\\n  globalCasesActive {\\n    currentlyInfectedPatients\\n    inMildCondition\\n    inMildConditionPercent\\n    seriousOrCritical\\n    seriousOrCriticalPercent\\n    __typename\\n  }\\n  globalCasesClosed {\\n    casesWhichHadAnOutcome\\n    recovered\\n    recoveredPercent\\n    deaths\\n    deathPercent\\n    __typename\\n  }\\n  globalCasesSummary {\\n    confirmed\\n    deaths\\n    recovered\\n    __typename\\n  }\\n  globalCasesToday {\\n    country\\n    totalCase\\n    newCases\\n    totalDeaths\\n    newDeaths\\n    totalRecovered\\n    activeCases\\n    seriousCritical\\n    totCases\\n    __typename\\n  }\\n  globalCasesYesterday {\\n    country\\n    totalCase\\n    newCases\\n    totalDeaths\\n    newDeaths\\n    totalRecovered\\n    activeCases\\n    seriousCritical\\n    totCases\\n    __typename\\n  }\\n  globalCasesAge {\\n    age\\n    deathConfirmedPercent\\n    deathAllPercent\\n    __typename\\n  }\\n  globalCasesGender {\\n    gender\\n    deathConfirmedPercent\\n    deathAllPercent\\n    __typename\\n  }\\n  trendlineGlobalCases {\\n    date\\n    confirmed\\n    recovered\\n    death\\n    __typename\\n  }\\n}\\n"}',

  method: "POST",
  mode: "cors",
};

function checkTime(number) {
  return (number = number < 10 ? "0" + number : number);
}

function formatNumber(number, commaDelete = "") {
  return number === null
    ? 0
    : parseInt((number + "").split(",").join("").replace(commaDelete, ""));
}

class KompaJsonDataSevice {
  constructor() {
    this.fetchData = this.fetchData.bind(this);
    this.onEvent = this.onEvent.bind(this);
    this.event = event;
  }

  rebuildJsonData(sourcesJson) {
    //Data is number not has prefix
    let today = new Date();
    let time =
      checkTime(today.getHours()) +
      ":" +
      checkTime(today.getMinutes()) +
      ":" +
      checkTime(today.getSeconds()) +
      " " +
      checkTime(today.getDate()) +
      "/" +
      checkTime(today.getMonth() + 1) +
      "/" +
      checkTime(today.getFullYear());
    let jsonData = {
      updateAt: time,
      global: {
        summary: {},
        countries: [],
      },
      vn: {},
    };
    let ttVC, ttVA, ttVR, ttVD;
    let ttVNC, ttVNA, ttVNR, ttVND;

    //Especially VN
    sourcesJson.globalCasesToday.some((oneCountry) => {
      if (oneCountry.country === "Vietnam") {
        ttVC = formatNumber(oneCountry.totalCase);
        ttVA = formatNumber(oneCountry.activeCases);
        ttVD = formatNumber(oneCountry.totalDeaths);
        ttVR = formatNumber(oneCountry.totalRecovered);
        ttVNC = formatNumber(oneCountry.newCases, "+");
        ttVND = formatNumber(oneCountry.newDeaths, "+");
        sourcesJson.globalCasesYesterday.some((country) => {
          if (country.country === oneCountry.country) {
            ttVNR =
              parseInt(formatNumber(ttVR)) -
              parseInt(formatNumber(country.totalRecovered));
            ttVNA =
              parseInt(formatNumber(ttVA)) -
              parseInt(formatNumber(country.activeCases));
          }
        });
      }
      jsonData.vn = {
        totalCase: ttVC,
        totalActive: ttVA,
        totalRecovered: ttVR,
        totalDeaths: ttVD,
        newCases: ttVNC,
        newActive: ttVNA,
        newDeaths: ttVND,
        newRecovered: ttVNR,
      };
    });

    //Each Country
    let index = 0;
    sourcesJson.globalCasesToday.forEach((oneCountry) => {
      let data;
      let ttNR, ttNA;
      let ttC = formatNumber(oneCountry.totalCase);
      let ttA = formatNumber(oneCountry.activeCases);
      let ttD = formatNumber(oneCountry.totalDeaths);
      let ttR = formatNumber(oneCountry.totalRecovered);
      let ttNC = formatNumber(oneCountry.newCases, "+");
      let ttND = formatNumber(oneCountry.newDeaths, "+");
      sourcesJson.globalCasesYesterday.some((country) => {
        if (country.country === oneCountry.country) {
          ttNR =
            parseInt(formatNumber(ttR)) -
            parseInt(formatNumber(country.totalRecovered));
          ttNA =
            parseInt(formatNumber(ttA)) -
            parseInt(formatNumber(country.activeCases));
          ++index;
        }
      });
      data = {
        index: index,
        country: oneCountry.country,
        totalCase: ttC,
        totalActive: ttA,
        totalRecovered: ttR,
        totalDeaths: ttD,
        newCases: ttNC,
        newActive: ttNA,
        newDeaths: ttND,
        newRecovered: ttNR,
      };

      if (oneCountry.country === "Total:") {
        jsonData.global.summary = data;
      } else {
        jsonData.global.countries.push(data);
      }
    });

    return jsonData;
  }

  async fetchData() {
    const fetchRt = await fetch(baseUri, fetchCountriesDataParam);
    const jsonData = await fetchRt.json();
    let data = this.rebuildJsonData(jsonData.data);
    return data;
  }

  checkAndNotifyChangedData() {
    let tmpJsonData = JSON.parse(fs.readFileSync(TMP_DATA).toString());
    let oldJsonData = JSON.parse(fs.readFileSync(REAL_DATA).toString());

    let okToNotify = false;

    if (
      tmpJsonData.global.summary.totalCase >
      oldJsonData.global.summary.totalCase
    )
      okToNotify = true;
    if (
      !okToNotify &&
      tmpJsonData.global.summary.totalCase ===
        oldJsonData.global.summary.totalCase &&
      tmpJsonData.global.summary.totalRecovered >
        oldJsonData.global.summary.totalRecovered
    )
      okToNotify = true;
    if (
      !okToNotify &&
      tmpJsonData.global.summary.totalCase ===
        oldJsonData.global.summary.totalCase &&
      tmpJsonData.global.summary.totalRecovered ===
        oldJsonData.global.summary.totalRecovered &&
      tmpJsonData.global.summary.totalDeaths >
        oldJsonData.global.summary.totalDeaths
    )
      okToNotify = true;

    if (!okToNotify) return false;

    console.log("Changed Data ", okToNotify);

    return okToNotify;
  }

  replaceJsonData() {
    const sourceJsonData = fs.readFileSync(TMP_DATA).toString();
    fs.writeFileSync(REAL_DATA, sourceJsonData);
  }

  getRealJsonData() {
    let realJsonData = JSON.parse(fs.readFileSync(REAL_DATA).toString());
    return realJsonData;
  }

  createCountinousEvent(onEvent) {
    if (!onEvent) {
      console.error("onEvent is not set!");
    }
    const continousEventDelay = CRAWLER_TIME; // x minutes
    let cronJob = "*/" + continousEventDelay + " * * * *";
    console.log("createCountinousEvent => Creating job for: %s", cronJob);
    this.job = schedule.scheduleJob(cronJob, function () {
      console.log("Event start!");
      try {
        onEvent();
      } catch (err) {
        console.log(err);
      }
    });
  }

  onEvent() {
    let dataRecive;
    this.fetchData().then((data) => {
      dataRecive = data;
      fs.writeFileSync(TMP_DATA, JSON.stringify(dataRecive));
      console.log("Fetch Success ", dataRecive);
      if (this.checkAndNotifyChangedData()) {
        this.replaceJsonData();
        this.event.emit("changed");
      }
    });
  }

  start() {
    if (this.job) return;
    this.createCountinousEvent(this.onEvent);
  }

  stop() {
    if (this.job) {
      this.job.cancel();
    }
  }
}

/* '{"operationName":null,"variables":{},"query":"{\\n  globalCasesActive {\\n    currentlyInfectedPatients\\n    inMildCondition\\n    inMildConditionPercent\\n    seriousOrCritical\\n    seriousOrCriticalPercent\\n    __typename\\n  }\\n  globalCasesClosed {\\n    casesWhichHadAnOutcome\\n    recovered\\n    recoveredPercent\\n    deaths\\n    deathPercent\\n    __typename\\n  }\\n  globalCasesSummary {\\n    confirmed\\n    deaths\\n    recovered\\n    __typename\\n  }\\n  globalCasesToday {\\n    country\\n    totalCase\\n    newCases\\n    totalDeaths\\n    newDeaths\\n    totalRecovered\\n    activeCases\\n    seriousCritical\\n    totCases\\n    __typename\\n  }\\n  globalCasesYesterday {\\n    country\\n    totalCase\\n    newCases\\n    totalDeaths\\n    newDeaths\\n    totalRecovered\\n    activeCases\\n    seriousCritical\\n    totCases\\n    __typename\\n  }\\n  globalCasesAge {\\n    age\\n    deathConfirmedPercent\\n    deathAllPercent\\n    __typename\\n  }\\n  globalCasesGender {\\n    gender\\n    deathConfirmedPercent\\n    deathAllPercent\\n    __typename\\n  }\\n  trendlineGlobalCases {\\n    date\\n    confirmed\\n    recovered\\n    death\\n    __typename\\n  }\\n}\\n"}',*/

var service = new KompaJsonDataSevice();
module.exports = service;
