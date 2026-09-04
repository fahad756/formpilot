/**
 * Client-side field matching (TypeScript mirror of backend utils/field_mapper.py).
 *
 * Used for instant offline matching without a round-trip to the backend.
 * The fill_map from the backend API is the authoritative source; this module
 * is the fallback when the extension is offline or for pre-flight previews.
 *
 * Keep FIELD_PATTERNS in sync with backend/app/utils/field_mapper.py.
 */

const FIELD_PATTERNS: Record<string, string[]> = {
  first_name:        ["firstname", "fname", "givenname", "forename", "first", "namefirst"],
  last_name:         ["lastname", "lname", "surname", "familyname", "last", "namelast"],
  full_name:         ["fullname", "legalname", "completename", "applicantname", "yourname"],
  email:             ["email", "emailaddress", "mail", "contactemail", "useremail"],
  phone:             ["phone", "phonenumber", "telephone", "mobile", "cell", "mobilenumber"],
  address_line1:     ["address", "address1", "streetaddress", "street", "mailingaddress"],
  city:              ["city", "town", "municipality", "locality"],
  state:             ["state", "province", "region", "stateprovince"],
  zip_code:          ["zip", "zipcode", "postal", "postalcode", "postcode"],
  country:           ["country", "countrycode", "nation"],
  linkedin_url:      ["linkedin", "linkedinurl", "linkedinprofile"],
  github_url:        ["github", "githuburl", "githubprofile"],
  portfolio_url:     ["portfolio", "portfoliourl", "website", "websiteurl", "personalwebsite"],
  current_title:     ["title", "jobtitle", "currenttitle", "position", "currentposition", "role"],
  years_experience:  ["experience", "yearsexperience", "experienceyears"],
  current_company:   ["company", "currentcompany", "employer", "organization"],
  degree:            ["degree", "qualification", "academicdegree"],
  major:             ["major", "fieldofstudy", "studyfield", "specialization"],
  university:        ["university", "college", "school", "institution"],
  graduation_year:   ["graduationyear", "gradyear", "graduation"],
  gpa:               ["gpa", "gradepointaverage", "cgpa"],
  cover_letter:      ["coverletter", "letter", "motivationletter", "message"],
  salary_expectation:["salary", "expectedsalary", "desiredsalary", "compensation"],
  availability:      ["availability", "startdate", "availablefrom"],
};

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Map a raw field identifier to a profile key. Returns null if no match. */
export function matchField(identifier: string): string | null {
  const norm = normalise(identifier);
  if (!norm) return null;

  let bestKey: string | null = null;
  let bestScore = 0;

  for (const [profileKey, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.length >= 4 && (norm.includes(pattern) || pattern.includes(norm))) {
        if (pattern.length > bestScore) {
          bestScore = pattern.length;
          bestKey = profileKey;
        }
      }
    }
  }

  return bestScore >= 4 ? bestKey : null;
}

/**
 * Build a local fill map from profile data (offline fallback).
 * Returns {identifier: value} for fields that have a match and a non-empty value.
 */
export function buildLocalFillMap(
  identifiers: string[],
  profile: Record<string, string | number>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const id of identifiers) {
    const key = matchField(id);
    if (!key) continue;
    const val = profile[key];
    if (val !== undefined && val !== null && String(val).trim()) {
      result[id] = String(val);
    }
  }
  return result;
}
