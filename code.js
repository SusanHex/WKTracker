const API_ROOT = 'https://api.wanikani.com/v2/';
const SUBJECTS_URL = API_ROOT + 'subjects';
const REVIEWS_URL  = API_ROOT + 'reviews';

// find API key from properties store

const API_TOKEN = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
if (API_TOKEN === null || API_TOKEN.length === 0) {
  PropertiesService.getUserProperties().setProperty('API_TOKEN', '');
  Logger.log('Please set API_TOKEN user property to your Wanikani API key.');
  throw 'API_TOKEN is null or ""';
};

String.prototype.addQuery = function (obj) {return this + "?" + Object.entries(obj).flatMap(([k, v]) => Array.isArray(v) ? v.map(e => `${k}=${encodeURIComponent(e)}`) : `${k}=${encodeURIComponent(v)}`).join("&");};

function main () {
  Logger.log('Begin main function')
}

function get_json (url, query=null) {
    let url_string = url; 
    let config = {
      'method': 'get',
      'headers': {
        'Authorization': API_TOKEN, 
      },
    };
    if (query !== null) {
        url_string = url_string.addQuery(query);
    };
    try {
        let response = UrlFetchApp.fetch(url_string, config);
        if (response.getResponseCode() === 200) {
            return JSON.parse(response.getContentText());
        }
    }
    catch (e){      
        throw e;
    }
}