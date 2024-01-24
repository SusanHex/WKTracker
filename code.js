const API_ROOT = 'https://api.wanikani.com/v2/';
const SUBJECTS_URL = API_ROOT + 'subjects';
const REVIEW_STATISTICS_URL  = API_ROOT + 'review_statistics';

// find API key from properties store

const API_TOKEN = get_script_property('API_TOKEN', 'Please set API_TOKEN script property to your Wanikani API key.');

String.prototype.addQuery = function (obj) {return this + "?" + Object.entries(obj).flatMap(([k, v]) => Array.isArray(v) ? v.map(e => `${k}=${encodeURIComponent(e)}`) : `${k}=${encodeURIComponent(v)}`).join("&");};

function main () {
    Logger.log('Begin main function');
    let review_stats = get_review_statistics();
    Logger.log(review_stats);
}

function get_json (url, query=null) {
    let url_string = url; 
    let config = {
      'method': 'get',
      'headers': {
        'Authorization': `Bearer ${API_TOKEN}`, 
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
        Logger.log(`GET "${url_string}" encountered an error: "${e}"`);
        throw e;
    }
}

function get_script_property(key, log_message=null, error_message=null) {
    let value = PropertiesService.getScriptProperties().getProperty(key);
    if (value === null || value.length === 0) {
        PropertiesService.getScriptProperties().setProperty(key, '');
        if (log_message === null) {
            Logger.log(`Please provide a value for '${key}'`);
        }
        else if (log_message.length > 0){
            Logger.log(log_message);
        }
        if (error_message === null) {
            throw `Script property '${key}' is null or empty`;
        }
        else if (error_message.length > 0) {
            throw error_message;
        }
        return null;
    };
    return value;
}

function get_review_statistics() {
    let review_stats = get_json(REVIEW_STATISTICS_URL);
    return review_stats;
}

function get_subjects() {

}