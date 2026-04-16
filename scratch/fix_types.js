const fs = require('fs');
function rr(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/==='Completed'|=== 'Completed'/g, "=== 'completed'");
  content = content.replace(/!==='Completed'|!== 'Completed'/g, "!== 'completed'");
  content = content.replace(/==='In Progress'|=== 'In Progress'/g, "=== 'in_progress'");
  content = content.replace(/!==='In Progress'|!== 'In Progress'/g, "!== 'in_progress'");
  content = content.replace(/==='To Do'|=== 'To Do'/g, "=== 'todo'");
  content = content.replace(/!==='To Do'|!== 'To Do'/g, "!== 'todo'");
  content = content.replace(/==='Overdue'|=== 'Overdue'/g, "=== 'overdue'");
  content = content.replace(/!==='Overdue'|!== 'Overdue'/g, "!== 'overdue'");

  // Fix strings passed as types or literal parameters
  content = content.replace(/'To Do' \| 'In Progress' \| 'Completed' \| 'Overdue'/g, "GoalStatus");
  content = content.replace(/status === "To Do"/g, 'status === "todo"');
  content = content.replace(/status === "In Progress"/g, 'status === "in_progress"');
  content = content.replace(/status === "Completed"/g, 'status === "completed"');
  content = content.replace(/status === "Overdue"/g, 'status === "overdue"');
  content = content.replace(/value="To Do"/g, 'value="todo"');
  content = content.replace(/value="In Progress"/g, 'value="in_progress"');
  content = content.replace(/status: 'To Do' as const/g, "status: 'todo' as const");
  content = content.replace(/status: "To Do"/g, 'status: "todo"');
  fs.writeFileSync(file, content);
}
rr('src/components/features/goals/CreateGoalModal.tsx');
rr('src/components/features/goals/SyllabusAI/SyllabusToGoalsModal.tsx');
rr('src/pages/DashboardPage.tsx');
rr('src/pages/ProfilePage.tsx');
rr('src/stores/useStore.ts');
