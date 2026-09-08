const sets = [
	{ label:'Sunrise', color:'#e2a44f', shapes:['tall','round','pear','short','tall'], rule:'Arrange by bottle shape: tall, round, pear, short, then tall.', riddle:'I arrive before the day is dressed. My five sparks turn sleepy shelves gold. What set am I?', hint:'Think of the first light over the shop.' },
	{ label:'Mosslight', color:'#7b9b72', shapes:['round','short','tall','pear','round'], rule:'Arrange by height: shortest to tallest, with round bottles breaking ties.', riddle:'No sun reaches my forest floor, yet I glow beneath the green. What set am I?', hint:'A soft light found under leaves.' },
	{ label:'Tidepool', color:'#5c9a9d', shapes:['short','pear','round','tall','short'], rule:'Arrange by silhouette: short, pear, round, tall, then short.', riddle:'I keep five little oceans in glass. Look for my changing edge and listen for the tide. What set am I?', hint:'Where the sea leaves bright pockets behind.' },
	{ label:'Emberveil', color:'#c76b55', shapes:['pear','tall','short','round','pear'], rule:'Arrange by silhouette: pear, tall, short, round, then pear.', riddle:'I am the last red thread of a fire, hidden under ash and waiting for breath. What set am I?', hint:'A warm glow that refuses to go out.' },
	{ label:'Moonmilk', color:'#b49dca', shapes:['round','tall','pear','short','round'], rule:'Arrange by silhouette: round, tall, pear, short, then round.', riddle:'I spill no light of my own, but every quiet roof knows my silver face. What set am I?', hint:'Find me after the sun clocks out.' },
	{ label:'Cinderroot', color:'#8b6b58', shapes:['short','tall','round','pear','tall'], rule:'Arrange by silhouette: short, tall, round, pear, then tall.', riddle:'I sleep below black soil, holding yesterday\'s heat in a patient knot. What set am I?', hint:'A seed, a coal, and a stubborn beginning.' }
];
const bottleNames = ['Aster','Bracken','Clover','Dahlia','Elm'];
let day = Number(localStorage.getItem('shelfDay') || 1), stars = Number(localStorage.getItem('shelfStars') || 0), activeSet, selectedSet = null, selectedBottle = null, bottles = [];
const el = (id) => document.getElementById(id);
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

function buildOrder() {
	activeSet = sets[(day - 1) % sets.length]; selectedSet = null; selectedBottle = null;
	bottles = shuffle(activeSet.shapes.map((shape, index) => ({ id:`${day}-${index}`, name:bottleNames[index], shape, color:activeSet.color, position:index })));
	el('day-label').textContent = `Day ${day}`; el('order-badge').textContent = String(((day - 1) % 99) + 1).padStart(2,'0'); el('order-title').textContent = `${activeSet.label} Parcel`;
	el('riddle-text').textContent = activeSet.riddle; el('riddle-hint').textContent = `Hint: ${activeSet.hint}`; el('rule-text').textContent = 'Solve the set label to reveal the shelf rule.'; el('set-feedback').textContent = ''; el('game-message').textContent = '';
	renderSetOptions(); renderShelf(); renderTray(); updateStatus();
}
function renderSetOptions() {
	const options = shuffle(sets).slice(0,4); if (!options.some((set) => set.label === activeSet.label)) options[0] = activeSet;
	el('set-options').innerHTML = options.map((set) => `<button class="set-option" type="button" data-set="${set.label}">${set.label}</button>`).join('');
	document.querySelectorAll('.set-option').forEach((button) => button.addEventListener('click', () => { selectedSet = button.dataset.set; document.querySelectorAll('.set-option').forEach((item) => item.classList.toggle('selected', item === button)); el('set-feedback').textContent = selectedSet === activeSet.label ? 'Correct clue' : 'Try again'; }));
}
function bottleMarkup(bottle) { return `<span class="bottle ${bottle.shape}" style="--liquid:${bottle.color}" aria-label="${bottle.name} potion"></span>`; }
function renderShelf() {
	el('shelf-slots').innerHTML = Array.from({length:5}, (_, index) => { const bottle = bottles[index]; return `<button class="shelf-slot${bottle ? ' active' : ''}" type="button" data-position="${index + 1}" data-slot="${index}">${bottle ? bottleMarkup(bottle) : ''}</button>`; }).join('');
	document.querySelectorAll('.shelf-slot').forEach((slot) => slot.addEventListener('click', () => placeBottle(Number(slot.dataset.slot))));
}
function renderTray() {
	el('bottle-tray').innerHTML = bottles.map((bottle) => `<button class="bottle-card${selectedBottle === bottle.id ? ' selected' : ''}" type="button" data-bottle="${bottle.id}">${bottleMarkup(bottle)}<span>${bottle.name}</span></button>`).join('');
	document.querySelectorAll('.bottle-card').forEach((card) => card.addEventListener('click', () => { selectedBottle = card.dataset.bottle; renderTray(); }));
}
function placeBottle(slotIndex) {
	if (!selectedBottle) return; const sourceIndex = bottles.findIndex((bottle) => bottle.id === selectedBottle); if (sourceIndex < 0) return;
	[bottles[sourceIndex], bottles[slotIndex]] = [bottles[slotIndex], bottles[sourceIndex]]; selectedBottle = null; renderShelf(); renderTray();
}
function updateStatus() {
	el('score-label').textContent = `${stars} ${stars === 1 ? 'star' : 'stars'}`; el('best-label').textContent = `Best run: ${stars} ${stars === 1 ? 'star' : 'stars'}`; el('progress-fill').style.width = `${Math.min(100,(stars % 5) * 20)}%`; el('progress-label').textContent = stars === 0 ? 'First delivery' : `${5 - (stars % 5 || 5)} more to the next rank`;
}
el('check-button').addEventListener('click', () => {
	if (selectedSet !== activeSet.label) { el('game-message').textContent = 'The riddle does not open this shelf. Re-read the dispatch note.'; return; }
	if (!bottles.every((bottle, index) => bottle.position === index)) { el('game-message').textContent = 'The set is right, but the bottles are still out of order.'; return; }
	stars += 1; localStorage.setItem('shelfStars', stars); el('rule-text').textContent = activeSet.rule; el('game-message').textContent = 'Perfect shelf. The shopkeeper nods approvingly.'; el('shelf-slots').classList.add('success-glow'); el('check-button').textContent = 'Next delivery  ->';
	el('check-button').onclick = () => { day += 1; localStorage.setItem('shelfDay', day); el('check-button').onclick = null; el('check-button').textContent = 'Unlock shelf  ->'; buildOrder(); }; updateStatus();
});
el('reset-button').addEventListener('click', () => { bottles = shuffle(bottles); selectedBottle = null; renderShelf(); renderTray(); el('game-message').textContent = ''; });
buildOrder();
