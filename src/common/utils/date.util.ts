export function getKST() {
  // new Date() 는 UTC 시간을 구해줌.
  // 참고로 한국 시간은 UTC+9
  const utc = new Date();
  const kst = utc.setHours(utc.getHours() + 9);

  // 반환할 때는 다시 new Date() 로 묶어서 반환.
  return new Date(kst);
}

export function getCurrentTime() {
  const currentTime = new Date();
  const currentYear = currentTime.getFullYear();
  const currentMonth = currentTime.getMonth() + 1;
  const currentDate = currentTime.getDate();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  return {
    year: currentYear,
    month: currentMonth,
    date: currentDate,
    hour: currentHour,
    minute: currentMinute,
    fullDateTime:
      currentYear +
      (currentMonth < 10 ? "0" : "") +
      currentMonth +
      (currentDate < 10 ? "0" : "") +
      currentDate +
      (currentHour < 10 ? "0" : "") +
      currentHour +
      (currentMinute < 10 ? "0" : "") +
      currentMinute,
  };
}
