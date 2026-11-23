// ============================================================================
//  גשר בין עולם המבחן לסנכרון עם My Day.
//  ExamContext יושב בתוך AppContext, ולכן AppContext (ומשם panmatzSync) לא
//  יכולים להגיע אליו דרך React. ExamProvider רושם כאן את עצמו:
//   • getState — מצב עולם המבחן הנוכחי (null עד שנטען)
//   • planFor(day, opts) — תוכנית ליום (planForDay)
//   • setTaskDone(taskId, day, done) — סימון שהגיע מ-My Day
// ============================================================================
let api = null;
export function setExamApi(a) { api = a; }
export function examApi() { return api; }
