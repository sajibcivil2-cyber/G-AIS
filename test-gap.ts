function checkGap() {
  const c1 = new Date('2020-01-01').getTime();
  const c2 = new Date('2026-08-01').getTime();
  console.log((c2 - c1) / (1000 * 3600 * 24));
}
checkGap();
