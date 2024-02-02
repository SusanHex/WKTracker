const API_ROOT = 'https://api.wanikani.com/v2/';
const SUBJECTS_URL = API_ROOT + 'subjects';
const REVIEW_STATISTICS_URL  = API_ROOT + 'review_statistics';

// find API key from properties store

const API_TOKEN = get_script_property('API_TOKEN', 'Please set API_TOKEN script property to your Wanikani API key.');

// find spreadsheet URL and sheet name from properties store

const SPREADSHEET_URL = get_script_property('SPREADSHEET_URL', 'Please set SPREADSHEET_URL to the URL of your Google Sheets spreadsheet');
const SPREADSHEET_SHEET_NAME = get_script_property('SPREADSHEET_SHEET_NAME', '', '');
const SPREADSHEET_HEADERS = get_script_property('SPREADSHEET_HEADERS', 'No value was found for SPREADSHEET_HEADERS property, set it to default', '', 'slug,subject_type,document_url,level,meaning_correct,meaning_incorrect,reading_correct,reading_incorrect')

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
    let subject_data = get_subjects(subject_ids);
    Logger.log(`Found ${subject_data.length} subjects`);
    let review_subjects = format_subjects_data(review_stats, subject_data);
    Logger.log(`Found ${Object.keys(review_subjects).length} review subject pairs`);
    write_to_sheet(review_subjects);
    Logger.log(`Finished writing to sheet.`);

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

function get_script_property(key, log_message=null, error_message=null, init_value='') {
    let value = PropertiesService.getScriptProperties().getProperty(key);
    if (value === null || value.length === 0) {
        PropertiesService.getScriptProperties().setProperty(key, init_value);
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
        if (init_value !== null && init_value.length > 0) {
            return init_value
        } else {
            return null;
        }
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

function format_subjects_data(review_stats, subject_data) {
    let review_subjects = {};
    
    for (const review of review_stats) {
        let review_id = review.data.subject_id;
        for (const subject of subject_data) {
            if (subject.id === review.data.subject_id) {
                review_subjects[review_id] = {
                    ...(review.data),
                    ...(subject.data),
                };
            }
        }
    }
    return review_subjects;
}

function write_to_sheet(subject_reviews) {
    let spreadsheet = null;
    try {
    spreadsheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    } catch (e) {
        Logger.log(`Failed to get spreadsheet at "${SPREADSHEET_URL}"`);
        throw e; 
    }
    SpreadsheetApp.openByUrl(SPREADSHEET_URL);
    Logger.log(`Found spreadsheet "${spreadsheet.getName()}" at ${spreadsheet.getUrl()}`);
    let sheet = null; 
    if (SPREADSHEET_SHEET_NAME === null) {
        sheet = spreadsheet.getActiveSheet();
    } else {
        sheet = spreadsheet.getSheetByName(SPREADSHEET_SHEET_NAME);    
    }
    if (sheet === null) {
        throw `"${SPREADSHEET_SHEET_NAME}" is not a valid sheet name in "${spreadsheet.getName()}"`
    }
    sheet.clear();
    let temp_data = [];
    let headers = get_header();
    temp_data.push(headers);
    for (const subject_id of Object.keys(subject_reviews)) {
        let subject = subject_reviews[subject_id];
        let temp_data_row = [];
        for(const header of headers) {
            temp_data_row.push(subject[header]);
        }
        temp_data.push(temp_data_row);
    }
    sheet.getRange(1,1, temp_data.length, temp_data[0].length).setValues(temp_data);
    Logger.log(`Wrote data to sheet named "${sheet.getName()}"`);
}

function get_header() {
    return SPREADSHEET_HEADERS.split(',');
}