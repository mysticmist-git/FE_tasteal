import unidecode from "unidecode";

export function removeDiacritics(text: string): string {
  return unidecode(text);
}

export function dateTimeToMinutes(value: string | number): number {
  if (typeof value === "number") {
    return value;
  }
  const parts = value.split(/[:.]/);
  let totalMinutes = 0;

  if (parts.length === 3) {
    // Đối với định dạng "hh:mm:ss"
    totalMinutes =
      parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60;
  } else if (parts.length === 4) {
    // Đối với định dạng "dd.hh:mm:ss"
    totalMinutes =
      parseInt(parts[0]) * 24 * 60 +
      parseInt(parts[1]) * 60 +
      parseInt(parts[2]) +
      parseInt(parts[3]) / 60;
  } else {
    // Chuỗi không hợp lệ
    return 0;
  }
  return Math.round(totalMinutes);
}

export function dateToDDMMYYYY(date: string | Date | undefined): string {
  if (!date) {
    return "";
  }
  if (typeof date === "string") {
    date = new Date(date);
  }
  const day = formatNumberWithLeadingZero(date.getDate());
  const month = formatNumberWithLeadingZero(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatNumberWithLeadingZero(number: number): string {
  return number < 10 ? `0${number}` : `${number}`;
}

/**
 * Convert minutes to a time string
 *
 * @param minutes - Minutes to convert
 * @returns A time string in format like "1h50m30s"
 */
export function minuteToTimeString(minutes: number) {
  const date = new Date();

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  date.setHours(hours);
  date.setMinutes(remainingMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date.toISOString();
}
