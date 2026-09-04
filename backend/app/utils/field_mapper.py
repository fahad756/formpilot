"""
Form field → profile key mapping engine.

This module is used both by the backend (to build autofill payloads) and is
mirrored in the extension's TypeScript field-matcher for offline matching.

DESIGN: normalise the incoming field identifier (name, id, placeholder, label)
to lowercase with no separators, then score it against each profile key's
pattern list. Return the best match above MATCH_THRESHOLD.

Adding support for a new profile field:
  1. Add an entry to FIELD_PATTERNS below
  2. Ensure the matching profile column exists in the DB and in models/user.py
"""

import re
from typing import Optional

# ─── Pattern registry ─────────────────────────────────────────────────────────
# Each key is a profile column name; values are normalised substrings/tokens
# that commonly appear in form field attributes for that concept.
FIELD_PATTERNS: dict[str, list[str]] = {
    "first_name": [
        "firstname", "fname", "givenname", "forename",
        "first", "namefirst", "applicantfirst", "candidatefirst",
    ],
    "last_name": [
        "lastname", "lname", "surname", "familyname",
        "last", "namelast", "applicantlast", "candidatelast",
    ],
    "full_name": [
        "fullname", "legalname", "completename", "displayname",
        "applicantname", "candidatename", "yourname",
    ],
    "email": [
        "email", "emailaddress", "mail", "contactemail",
        "workemail", "useremail", "loginemail",
    ],
    "phone": [
        "phone", "phonenumber", "telephone", "mobile",
        "cell", "cellphone", "contactnumber", "mobilenumber",
    ],
    "address_line1": [
        "address", "address1", "streetaddress", "street",
        "addr", "line1", "addressline1", "mailingaddress",
    ],
    "city": ["city", "town", "municipality", "locality", "cityname"],
    "state": ["state", "province", "region", "stateprovince", "statecode"],
    "zip_code": ["zip", "zipcode", "postal", "postalcode", "postcode"],
    "country": ["country", "countrycode", "nation", "countryname"],
    "linkedin_url": ["linkedin", "linkedinurl", "linkedinprofile", "linkedinlink"],
    "github_url": ["github", "githuburl", "githubprofile", "giturl"],
    "portfolio_url": [
        "portfolio", "portfoliourl", "website", "websiteurl",
        "personalwebsite", "personalsite", "portfoliosite",
    ],
    "current_title": [
        "title", "jobtitle", "currenttitle", "position",
        "currentposition", "role", "currentrole", "designation",
        "professionaltitle", "occupation",
    ],
    "years_experience": [
        "experience", "yearsexperience", "yearsofexperience",
        "experienceyears", "totalexperience",
    ],
    "current_company": [
        "company", "currentcompany", "employer", "currentemployer",
        "organization", "organisation", "workplace",
    ],
    "degree": [
        "degree", "qualification", "academicdegree",
        "highestdegree", "degreetype", "degreelevel",
    ],
    "major": [
        "major", "fieldofstudy", "studyfield", "specialization",
        "concentration", "discipline", "subject",
    ],
    "university": [
        "university", "college", "school", "institution",
        "universityname", "collegename", "schoolname", "almamater",
    ],
    "graduation_year": [
        "graduationyear", "gradyear", "graduation",
        "yearofgraduation", "graduationdate", "classof",
    ],
    "gpa": ["gpa", "gradepointaverage", "cgpa", "cumulativegpa", "grade"],
    "cover_letter": [
        "coverletter", "letter", "motivationletter",
        "applicationletter", "message", "aboutyourself",
        "aboutyou", "tellusabout",
    ],
    "salary_expectation": [
        "salary", "expectedsalary", "salaryexpectation",
        "desiredsalary", "compensation", "expectedcompensation",
    ],
    "availability": [
        "availability", "startdate", "availablefrom",
        "joindate", "noticeperiod", "earlieststart",
    ],
}

# Minimum ratio of pattern tokens that must match for a field to be mapped
MATCH_THRESHOLD = 0.75


def _normalise(text: str) -> str:
    """Strip all non-alphanumeric characters and lowercase."""
    return re.sub(r"[^a-z0-9]", "", text.lower())


def match_field(identifier: str) -> Optional[str]:
    """
    Given a raw form field identifier (name/id/placeholder/label text),
    return the best-matching profile key or None if confidence is too low.

    Algorithm:
      1. Normalise the identifier
      2. For each profile key, check if any of its patterns are a substring
         of the normalised identifier (or vice versa)
      3. Return the key whose longest pattern substring match wins
    """
    normalised = _normalise(identifier)
    if not normalised:
        return None

    best_key: Optional[str] = None
    best_score: int = 0  # length of the matched pattern token

    for profile_key, patterns in FIELD_PATTERNS.items():
        for pattern in patterns:
            # Substring match in both directions — handles compound identifiers
            # e.g. "applicantEmailAddress" contains "email"
            if pattern in normalised or normalised in pattern:
                score = len(pattern)
                if score > best_score:
                    best_score = score
                    best_key = profile_key

    # Require at least 4 chars to avoid spurious single-letter matches
    return best_key if best_score >= 4 else None


def build_autofill_map(
    field_identifiers: list[str],
    profile: dict,
) -> dict[str, str]:
    """
    Map a list of form field identifiers to their fill values from a profile dict.

    Returns a dict of {original_identifier: fill_value} for all fields that
    could be matched and have a non-empty profile value.
    """
    result: dict[str, str] = {}
    for identifier in field_identifiers:
        profile_key = match_field(identifier)
        if profile_key is None:
            continue
        value = profile.get(profile_key)
        if value is not None and str(value).strip():
            result[identifier] = str(value)
    return result
