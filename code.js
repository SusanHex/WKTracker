const API_ROOT = 'https://api.wanikani.com/v2/';
const SUBJECTS_URL = API_ROOT + 'subjects';
const REVIEWS_URL  = API_ROOT + 'reviews';

// find API key from properties store

const API_TOKEN = get_script_property('API_TOKEN', 'Please set API_TOKEN script property to your Wanikani API key.')

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

function get_script_property(key, log_message=null, error_message=null) {
    let value = PropertiesService.getScriptProperties().getProperty(key);
    if (value === null || value.length === 0) {
        PropertiesService.getScriptProperties().setProperty(key, '');
        if (log_message !== null) {
            Logger.log(log_message);
        }
        else if (log_message !== ''){
            Logger.log(`Please provide a value for '${key}'`);
        }
        if (error_message !== null) {
            throw error_message;
        }
        else if (error_message !== '') {
            throw `Script property '${key}' is null or empty`;
        }
        return null;
    };
    return value;
}