// Convert number to Persian words
export function numberToPersianWords(num: number): string {
  if (num === 0) return 'صفر';

  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';

    let result = '';

    // Hundreds
    const h = Math.floor(n / 100);
    if (h > 0) {
      result += hundreds[h] + ' ';
      n %= 100;
    }

    // Tens and ones
    if (n >= 10 && n < 20) {
      result += teens[n - 10];
    } else {
      const t = Math.floor(n / 10);
      const o = n % 10;
      
      if (t > 0) {
        result += tens[t];
        if (o > 0) result += ' و ';
      }
      if (o > 0) {
        result += ones[o];
      }
    }

    return result.trim();
  }

  if (num < 0) return 'منفی ' + numberToPersianWords(-num);
  if (num < 1000) return convertLessThanThousand(num);

  const scales = [
    { value: 1000000000, name: 'میلیارد' },
    { value: 1000000, name: 'میلیون' },
    { value: 1000, name: 'هزار' }
  ];

  let result = '';
  for (const scale of scales) {
    if (num >= scale.value) {
      const count = Math.floor(num / scale.value);
      result += convertLessThanThousand(count) + ' ' + scale.name;
      num %= scale.value;
      if (num > 0) result += ' و ';
    }
  }

  if (num > 0) {
    result += convertLessThanThousand(num);
  }

  return result.trim();
}

// Convert number to English words (simple version)
export function numberToEnglishWords(num: number): string {
  if (num === 0) return 'zero';

  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';

    let result = '';

    const h = Math.floor(n / 100);
    if (h > 0) {
      result += ones[h] + ' hundred';
      n %= 100;
      if (n > 0) result += ' and ';
    }

    if (n >= 10 && n < 20) {
      result += teens[n - 10];
    } else {
      const t = Math.floor(n / 10);
      const o = n % 10;
      
      if (t > 0) {
        result += tens[t];
        if (o > 0) result += '-';
      }
      if (o > 0) {
        result += ones[o];
      }
    }

    return result.trim();
  }

  if (num < 0) return 'negative ' + numberToEnglishWords(-num);
  if (num < 1000) return convertLessThanThousand(num);

  const scales = [
    { value: 1000000000, name: 'billion' },
    { value: 1000000, name: 'million' },
    { value: 1000, name: 'thousand' }
  ];

  let result = '';
  for (const scale of scales) {
    if (num >= scale.value) {
      const count = Math.floor(num / scale.value);
      result += convertLessThanThousand(count) + ' ' + scale.name;
      num %= scale.value;
      if (num > 0) result += ' ';
    }
  }

  if (num > 0) {
    result += convertLessThanThousand(num);
  }

  return result.trim();
}

export function numberToWords(num: number, language: 'en' | 'fa'): string {
  return language === 'fa' ? numberToPersianWords(num) : numberToEnglishWords(num);
}
