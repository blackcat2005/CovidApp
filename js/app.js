let service = require("./dataKompa");
const fs = require("fs");
const EventEmitter = require("events").EventEmitter;
let event = new EventEmitter();

let data;
// var path = process.resourcesPath;

// var REAL_DATA = path + "\\app\\src\\data.json";
// var TMP_DATA = path + "\\app\\src\\tmp.data.json";
const REAL_DATA = __dirname + "/../src/data.json";
const TMP_DATA = __dirname + "/../src/tmp.data.json";

function clearFile() {
  fs.writeFile(TMP_DATA, "", () => {});
  fs.writeFile(REAL_DATA, "", () => {});
  console.log("Clear File");
}

function getDataByCountryStart(countryName) {
  this.data = JSON.parse(fs.readFileSync(REAL_DATA).toString());
  let country = [];
  this.data.global.countries.some((oneCountry) => {
    if (
      oneCountry.country.toLowerCase().startsWith(countryName.toLowerCase())
    ) {
      country.push(oneCountry);
    }
  });
  return country;
}

function getDataCountry(countryName) {
  return getDataByCountryStart(countryName)[0];
}

function getDataVietNam() {
  return getDataByCountryStart("Vietnam")[0];
}

function getDataWorld() {
  this.data = JSON.parse(fs.readFileSync(REAL_DATA).toString());
  return this.data.global.summary;
}

// Cacluate number of normal tables with number item declared and return tables
// return {numbertable, [tables]}
function getTables(source, numberItem = 10) {
  let oneTable = source;
  let length = oneTable.length;
  let tables = {
    numberTable: 0,
    tables: [],
  };
  if (oneTable === []) {
    return tables;
  }
  let numberTable = Math.floor(length / numberItem) + 1;
  let j = 0;
  for (let i = 0; i < numberTable; i++) {
    tables.tables.push([
      j,
      i === numberTable - 1 ? length - 1 : j + numberItem - 1,
    ]);
    j += numberItem;
  }
  tables.numberTable = numberTable;
  return tables;
}
function getTablesNormal(numberItem = 10) {
  this.data = JSON.parse(fs.readFileSync(REAL_DATA).toString());
  let oneTable = this.data.global.countries;
  let tables = getTables(oneTable, numberItem);
  return tables;
}

function getTableSearch(countryName, numberItem = 10) {
  let oneTable = getDataByCountryStart(countryName);
  let tables = getTables(oneTable, numberItem);
  return tables;
}

function getUpdateTime() {
  this.data = JSON.parse(fs.readFileSync(REAL_DATA).toString());
  let time = this.data.updateAt;
  return time;
}

service.event.on("changed", () => {
  event.emit("changed");
});

var appMain = {
  clearFile: function () {
    return clearFile();
  },
  eventChange: event,
  data: data,
  getDataByCountry: function (countryName) {
    return getDataCountry(countryName);
  },
  getDataByCountryStart: function (countryName) {
    return getDataByCountryStart(countryName);
  },
  getDataVietNam: function () {
    return getDataVietNam();
  },
  getDataWorld: function () {
    return getDataWorld();
  },
  getTablesNormal: function (numberItem) {
    return getTablesNormal(numberItem);
  },
  getUpdateTime: function () {
    return getUpdateTime();
  },
  getTableSearch: function (countryName, numberItem) {
    return getTableSearch(countryName, numberItem);
  },
  first: function () {
    return service.fetchData();
  },
  start: function () {
    return service.start();
  },
  stop: function () {
    console.log("stop");
    return service.stop();
  },
};

module.exports = appMain;
