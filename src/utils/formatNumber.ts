// Convert Persian/Arabic digits to English digits
export function convertToEnglishDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let result = str;
  
  // Convert Persian digits
  persianDigits.forEach((digit, index) => {
    result = result.replace(new RegExp(digit, 'g'), index.toString());
  });
  
  // Convert Arabic digits
  arabicDigits.forEach((digit, index) => {
    result = result.replace(new RegExp(digit, 'g'), index.toString());
  });
  
  return result;
}

// Format number with thousand separators
export function formatNumber(num: string | number): string {
  const numStr = typeof num === 'string' ? num : num.toString();
  const number = parseFloat(numStr);
  
  if (isNaN(number)) return numStr;
  
  return number.toLocaleString('en-US');
}

// Format number for Persian (with Persian digits)
export function formatNumberPersian(num: string | number): string {
  const numStr = typeof num === 'string' ? num : num.toString();
  const number = parseFloat(numStr);
  
  if (isNaN(number)) return numStr;
  
  // Format with commas first
  const formatted = number.toLocaleString('en-US');
  
  // Convert to Persian digits
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return formatted.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

// Format number based on language
export function formatNumberLocale(num: string | number, language: 'en' | 'fa'): string {
  return language === 'fa' ? formatNumberPersian(num) : formatNumber(num);
}
