const COMMON_PASSWORD_WORDS = [
  "password", "passw0rd", "welcome", "qwerty", "letmein", "admin",
  "administrator", "login", "user", "trading", "trade", "forex",
  "crypto", "pip", "pipe", "pipeid",
];

export function getPasswordCriteria(value) {
  const password = String(value || "");
  return {
    uppercase: (password.match(/[A-Z]/g) || []).length >= 2,
    lowercase: (password.match(/[a-z]/g) || []).length >= 2,
    number: (password.match(/\d/g) || []).length >= 2,
    symbol: (password.match(/[^A-Za-z0-9]/g) || []).length >= 2,
  };
}

function getPasswordCounts(value) {
  const password = String(value || "");
  return {
    uppercase: (password.match(/[A-Z]/g) || []).length,
    lowercase: (password.match(/[a-z]/g) || []).length,
    number: (password.match(/\d/g) || []).length,
    symbol: (password.match(/[^A-Za-z0-9]/g) || []).length,
  };
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hasCommonPasswordWord(value) {
  const normalized = normalize(value);
  return COMMON_PASSWORD_WORDS.some((word) => normalized.includes(word));
}

function hasSequentialPattern(value) {
  const normalized = normalize(value);
  for (let i = 0; i <= normalized.length - 3; i += 1) {
    const codes = normalized.slice(i, i + 3).split("").map((char) => char.charCodeAt(0));
    if ((codes[1] === codes[0] + 1 && codes[2] === codes[1] + 1) ||
        (codes[1] === codes[0] - 1 && codes[2] === codes[1] - 1)) return true;
  }
  return false;
}

function hasRepeatedPattern(value) {
  const normalized = normalize(value);
  if (/(.)\1\1/.test(normalized)) return true;
  if (normalized.length >= 6) {
    for (let size = 1; size <= Math.floor(normalized.length / 2); size += 1) {
      const unit = normalized.slice(0, size);
      if (unit.repeat(Math.floor(normalized.length / size)) === normalized) return true;
    }
  }
  return false;
}

function hasYearPattern(value) {
  return /(?:19|20)\d{2}/.test(String(value || ""));
}

function looksLikePersonalIdentifier(password, email) {
  const passwordNormalized = normalize(password);
  const emailLocal = String(email || "").split("@")[0];
  const localNormalized = normalize(emailLocal);
  return localNormalized.length >= 3 && passwordNormalized.includes(localNormalized);
}


export function assessPassword(value, email = "") {
  const password = String(value || "");
  const criteria = getPasswordCriteria(password);
  const counts = getPasswordCounts(password);
  const score = Object.values(criteria).filter(Boolean).length;
  const lengthValid = password.length === 8;
  const compositionValid =
    counts.uppercase === 2 &&
    counts.lowercase === 2 &&
    counts.number === 2 &&
    counts.symbol === 2;
  const commonWord = hasCommonPasswordWord(password);
  const repeatedPattern = hasRepeatedPattern(password);
  const sequentialPattern = hasSequentialPattern(password);
  const yearPattern = hasYearPattern(password);
  const personalIdentifier = looksLikePersonalIdentifier(password, email);

  let level = 1;
  if (score >= 2 && !commonWord) level = 2;
  if (score >= 3 && !repeatedPattern && !sequentialPattern) level = 3;

  // Registration passwords are exactly 8 characters. A full four-class
  // password (upper/lower/number/symbol) with no obvious weak pattern is
  // considered Very Strong; requiring looksRandom() made good 8-char
  // passwords incorrectly stop at Strong.
  if (lengthValid && compositionValid && !commonWord && !repeatedPattern &&
      !sequentialPattern && !yearPattern && !personalIdentifier) {
    level = 4;
  }

  if (!password) level = 0;

  return {
    criteria,
    score,
    level,
    lengthValid,
    compositionValid,
    counts,
    commonWord,
    repeatedPattern,
    sequentialPattern,
    yearPattern,
    personalIdentifier,
  };
}
