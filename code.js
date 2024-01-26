const API_ROOT = 'https://api.wanikani.com/v2/';
const SUBJECTS_URL = API_ROOT + 'subjects';
const REVIEW_STATISTICS_URL  = API_ROOT + 'review_statistics';

// find API key from properties store

const API_TOKEN = get_script_property('API_TOKEN', 'Please set API_TOKEN script property to your Wanikani API key.');

String.prototype.addQuery = function (obj) {return this + "?" + Object.entries(obj).flatMap(([k, v]) => Array.isArray(v) ? v.map(e => `${k}=${encodeURIComponent(e)}`) : `${k}=${encodeURIComponent(v)}`).join("&");};

function main () {
    Logger.log('Begin main function');
    let review_stats = get_review_statistics();
    Logger.log(`Found ${review_stats.length} review stats`);
    let subject_ids = [];
    for (const review of review_stats) {
        subject_ids.push(review.data.subject_id);
    }
    Logger.log(`Found ${subject_ids.length} subject IDs`);
    let subjects = get_subjects(subject_ids);
    Logger.log(`Found ${subjects.length} subjects`);
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
    let review_stats_data = [];
    review_stats_data.push(...(review_stats.data)); 

    while (review_stats.pages.next_url !== null) {
        review_stats = get_json(review_stats.pages.next_url);
        review_stats_data.push(...(review_stats.data)); 
    }
    return review_stats_data;
}

function get_subjects(subjects=null) {
    let subject_response = null;
    let subject_data = [];
    if (subjects !== null && subjects.length > 0) {
        let MAX_SUBJECTS_PER_REQUEST = 100;
        let subject_index_counter = 0;
        let sub_subject_array = [];
        do {
            sub_subject_array = subjects.slice(subject_index_counter, subject_index_counter+MAX_SUBJECTS_PER_REQUEST);
            subject_response = get_json(SUBJECTS_URL + `?ids=${sub_subject_array.join(',')}`);
            subject_data.push(...(subject_response.data));
            subject_index_counter += 100;
        } while (subject_index_counter < subjects.length);
        

    } else {
        subject_response = get_json(SUBJECTS_URL);
        subject_data.push(...(subject_response.data));
        while(subject_response.pages.next_url !== null) {
            subject_response = get_json(subject_response.pages.next_url);
            subject_data.push(...(subject_response.data));
        } 
    }

    return subject_data;
}