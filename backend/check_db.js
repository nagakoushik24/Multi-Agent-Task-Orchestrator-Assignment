const fs = require('fs');
const db = JSON.parse(fs.readFileSync('database.json', 'utf8'));
console.log('Total tasks:', db.tasks.length, 'Total events:', db.events.length);
db.tasks.forEach(function(t) {
  const evs = db.events.filter(function(e) { return e.taskId === t.id; });
  console.log('\nTask:', t.prompt, '| Status:', t.status, '| Events:', evs.length);
  evs.forEach(function(e) {
    console.log(' ', e.agentName, '['+e.eventType+']', e.message.substring(0, 80));
  });
});
