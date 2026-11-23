// פתיחת משימה מתוכנית היום — מכל מקום (היום, הכרטיס בפנמ"צ, התראה).
export function startTask(nav, task, state) {
  if (!task) return;
  if (task.kind === 'quiz') nav.navigate('Quiz', { mode: task.mode, taskId: task.id, count: task.count });
  else if (task.kind === 'cards') nav.navigate('Cards', { taskId: task.id, words: task.words });
  else if (task.kind === 'lesson') nav.navigate('Lesson', { topic: task.topic, taskId: task.id });
  else if (task.kind === 'sim') nav.navigate('Sim', { taskId: task.id, resume: !!state?.activeSim });
}

export const TASK_ICON = { quiz: 'help-circle-outline', cards: 'albums-outline', lesson: 'book-outline', sim: 'stopwatch-outline' };
