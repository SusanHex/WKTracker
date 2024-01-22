const API_ROOT = "https://api.wanikani.com/v2/";
const SUBJECTS_URL = API_ROOT + "subjects";
const REVIEWS_URL  = API_ROOT + "reviews";

String.prototype.addQuery = function (obj) {return this + "?" + Object.entries(obj).flatMap(([k, v]) => Array.isArray(v) ? v.map(e => `${k}=${encodeURIComponent(e)}`) : `${k}=${encodeURIComponent(v)}`).join("&");};

function main () {
  
}

function get_json (url, query=null) {

} 