const {test}=require('node:test');
const assert=require('node:assert/strict');
let util;
async function get(){return util??=await import('../src/utils.ts')}
test('money converts to integer minor units without floating point storage',async()=>{const {amountToMinor,minorToInput}=await get();assert.equal(amountToMinor('12.34'),1234);assert.equal(amountToMinor('0.01'),1);assert.equal(minorToInput(1234),'12.34');for(const x of ['0','-2','1.234','abc'])assert.throws(()=>amountToMinor(x));});
test('recurring dates account for weekdays and month ends',async()=>{const {nextDue,localDate}=await get();assert.equal(localDate(new Date(nextDue(new Date('2026-10-30T12:00:00').getTime(),'weekdays'))),'2026-11-02');assert.equal(localDate(new Date(nextDue(new Date('2026-01-31T12:00:00').getTime(),'monthly'))),'2026-02-28');});
test('habit streak skips unscheduled days',async()=>{const {streak}=await get();assert.equal(streak('1,2,3,4,5','2026-10-01',new Set(['2026-10-16','2026-10-19']),'2026-10-19'),2);assert.equal(streak('daily','2026-10-01',new Set(['2026-10-17','2026-10-19']),'2026-10-19'),1);});
test('best streak uses scheduled calendar days',async()=>{const {bestStreak}=await get();assert.equal(bestStreak('1,2,3,4,5','2026-10-14',new Set(['2026-10-14','2026-10-15','2026-10-16','2026-10-19']),'2026-10-19'),4);});
