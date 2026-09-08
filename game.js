const sets = [
	{ label:'Sunrise', color:'#e2a44f', shapes:['tall','round','pear','short','tall'], rule:'Arrange by bottle shape: tall, round, pear, short, then tall.', riddle:'I arrive before the day is dressed. My five sparks turn sleepy shelves gold. What set am I?', hint:'Think of the first light over the shop.' },
	{ label:'Mosslight', color:'#7b9b72', shapes:['round','short','tall','pear','round'], rule:'Arrange by height: shortest to tallest, with round bottles breaking ties.', riddle:'No sun reaches my forest floor, yet I glow beneath the green. What set am I?', hint:'A soft light found under leaves.' },
	{ label:'Tidepool', color:'#5c9a9d', shapes:['short','pear','round','tall','short'], rule:'Arrange by silhouette: short, pear, round, tall, then short.', riddle:'I keep five little oceans in glass. Look for my changing edge and listen for the tide. What set am I?', hint:'Where the sea leaves bright pockets behind.' },
	{ label:'Emberveil', color:'#c76b55', shapes:['pear','tall','short','round','pear'], rule:'Arrange by silhouette: pear, tall, short, round, then pear.', riddle:'I am the last red thread of a fire, hidden under ash and waiting for breath. What set am I?', hint:'A warm glow that refuses to go out.' },
	{ label:'Moonmilk', color:'#b49dca', shapes:['round','tall','pear','short','round'], rule:'Arrange by silhouette: round, tall, pear, short, then round.', riddle:'I spill no light of my own, but every quiet roof knows my silver face. What set am I?', hint:'Find me after the sun clocks out.' },
	{ label:'Cinderroot', color:'#8b6b58', shapes:['short','tall','round','pear','tall'], rule:'Arrange by silhouette: short, tall, round, pear, then tall.', riddle:'I sleep below black soil, holding yesterday\'s heat in a patient knot. What set am I?', hint:'A seed, a coal, and a stubborn beginning.' }
];
const bottleNames = ['Aster','Bracken','Clover','Dahlia','Elm'];
const storageGet = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch (error) { return fallback; } };
const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
const savedUpgrades = (() => { try { return JSON.parse(storageGet('shelfUpgrades', '{}')); } catch (error) { return {}; } })();
const upgrades = { capacity:6, speed:1, map:false, recall:false, ...savedUpgrades };
let day = Number(storageGet('shelfDay', 1)), stars = Number(storageGet('shelfStars', 0)), activeSet, selectedSet = null, selectedBottle = null, bottles = [], shelfOrder = [];
const el = (id) => document.getElementById(id);
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

function buildOrder() {
	activeSet = sets[(day - 1) % sets.length]; selectedSet = null; selectedBottle = null;
	bottles = shuffle(activeSet.shapes.map((shape, index) => ({ id:`${day}-${index}`, name:bottleNames[index], shape, color:activeSet.color, position:index, floorX:8 + Math.random() * 78, floorY:10 + Math.random() * 50, rotation:-12 + Math.random() * 24 })));
	shelfOrder = Array(5).fill(null);
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
	el('shelf-slots').innerHTML = shelfOrder.map((bottle, index) => `<button class="shelf-slot${bottle ? ' active' : ''}" type="button" data-target="${activeSet.shapes[index]}" data-position="${index + 1}" data-slot="${index}">${bottle ? bottleMarkup(bottle) : ''}</button>`).join('');
	document.querySelectorAll('.shelf-slot').forEach((slot) => slot.addEventListener('click', () => placeBottle(Number(slot.dataset.slot))));
}
function renderTray() {
	const shelved = new Set(shelfOrder.filter(Boolean).map((bottle) => bottle.id));
	el('bottle-tray').innerHTML = bottles.filter((bottle) => !shelved.has(bottle.id)).map((bottle) => `<button class="bottle-card${selectedBottle === bottle.id ? ' selected' : ''}" style="left:${bottle.floorX}%;top:${bottle.floorY}%;transform:rotate(${bottle.rotation}deg)" type="button" data-bottle="${bottle.id}">${bottleMarkup(bottle)}<span>${bottle.name}</span></button>`).join('');
	document.querySelectorAll('.bottle-card').forEach((card) => {
		card.addEventListener('click', () => { selectedBottle = card.dataset.bottle; renderTray(); });
		card.addEventListener('pointerdown', (event) => beginDrag(event, card));
	});
}
function placeBottle(slotIndex) {
	if (!selectedBottle) return;
	const bottle = bottles.find((item) => item.id === selectedBottle); if (!bottle) return;
	const previousSlot = shelfOrder.findIndex((item) => item && item.id === bottle.id);
	if (previousSlot < 0 && shelfOrder.filter(Boolean).length >= upgrades.capacity) { el('game-message').textContent = `Your hands are full. Upgrade carrying capacity to hold more than ${upgrades.capacity}.`; return; }
	if (previousSlot >= 0) shelfOrder[previousSlot] = shelfOrder[slotIndex];
	shelfOrder[slotIndex] = bottle; selectedBottle = null; renderShelf(); renderTray(); updatePlayer();
}
function beginDrag(event, card) {
	selectedBottle = card.dataset.bottle; card.classList.add('dragging'); card.setPointerCapture(event.pointerId);
	const trayRect = el('bottle-tray').getBoundingClientRect();
	const move = (moveEvent) => { card.style.left = `${moveEvent.clientX - trayRect.left - card.offsetWidth / 2}px`; card.style.top = `${moveEvent.clientY - trayRect.top - card.offsetHeight / 2}px`; };
	const end = (endEvent) => {
		card.classList.remove('dragging'); card.releasePointerCapture(event.pointerId); card.removeEventListener('pointermove', move); card.removeEventListener('pointerup', end);
		const target = document.elementFromPoint(endEvent.clientX, endEvent.clientY)?.closest('.shelf-slot');
		if (target) placeBottle(Number(target.dataset.slot)); else renderTray();
	};
	card.addEventListener('pointermove', move); card.addEventListener('pointerup', end);
}
function updateStatus() {
	el('score-label').textContent = `${stars} ${stars === 1 ? 'star' : 'stars'}`; el('best-label').textContent = `Best run: ${stars} ${stars === 1 ? 'star' : 'stars'}`; el('progress-fill').style.width = `${Math.min(100,(stars % 5) * 20)}%`; el('progress-label').textContent = stars === 0 ? 'First delivery' : `${5 - (stars % 5 || 5)} more to the next rank`;
	updatePlayer();
}
function updatePlayer() {
	const carried = shelfOrder.filter(Boolean).length;
	el('carry-label').textContent = `Carrying ${carried} / ${upgrades.capacity}`;
	el('speed-label').textContent = `Walking speed ${'I'.repeat(upgrades.speed)}`;
	const capacityCost = Math.floor((upgrades.capacity - 4) / 2) + 1;
	el('capacity-upgrade').querySelector('span').textContent = `Cost: ${capacityCost} stars`;
	el('speed-upgrade').querySelector('span').textContent = `Cost: ${upgrades.speed + 1} stars`;
	el('map-button').querySelector('span').textContent = upgrades.map ? 'Unlocked: click to show' : 'Unlock: 3 stars';
	el('recall-button').querySelector('span').textContent = upgrades.recall ? 'Unlocked: gather type' : 'Unlock: 4 stars';
	el('map-button').classList.toggle('unlocked', upgrades.map); el('recall-button').classList.toggle('unlocked', upgrades.recall);
	el('map-button').classList.toggle('locked', !upgrades.map); el('recall-button').classList.toggle('locked', !upgrades.recall);
}
function saveUpgrades() { storageSet('shelfUpgrades', JSON.stringify(upgrades)); updateStatus(); }
function buyUpgrade(type) {
	const costs = { capacity:Math.floor((upgrades.capacity - 4) / 2) + 1, speed:upgrades.speed + 1, map:3, recall:4 };
	if ((type === 'map' && upgrades.map) || (type === 'recall' && upgrades.recall)) { if (type === 'map') el('room-scene').classList.toggle('map-visible'); return; }
	if ((type === 'map' && stars < costs.map) || (type === 'recall' && stars < costs.recall) || ((type === 'capacity' || type === 'speed') && stars < costs[type])) { el('game-message').textContent = `You need ${costs[type]} stars for that upgrade.`; return; }
	stars -= costs[type];
	if (type === 'capacity') upgrades.capacity += 2;
	if (type === 'speed') upgrades.speed += 1;
	if (type === 'map') upgrades.map = true;
	if (type === 'recall') upgrades.recall = true;
	saveUpgrades(); el('game-message').textContent = type === 'recall' ? 'Same-type recall is ready in the backroom.' : 'Upgrade installed.';
}
function recallSameType() {
	if (!upgrades.recall) return buyUpgrade('recall');
	const unshelved = bottles.filter((bottle) => !shelfOrder.some((item) => item && item.id === bottle.id));
	unshelved.forEach((bottle, index) => { bottle.floorX = 35 + (index % 3) * 18; bottle.floorY = 18 + Math.floor(index / 3) * 22; bottle.rotation = 0; });
	renderTray(); el('game-message').textContent = 'Recall grouped every matching potion within reach.';
}
el('check-button').addEventListener('click', () => {
	if (selectedSet !== activeSet.label) { el('game-message').textContent = 'The riddle does not open this shelf. Re-read the dispatch note.'; return; }
	if (!shelfOrder.every((bottle, index) => bottle && bottle.position === index)) { el('game-message').textContent = 'The set is right, but every bottle still needs the correct bay.'; return; }
	stars += 1; storageSet('shelfStars', stars); el('rule-text').textContent = activeSet.rule; el('game-message').textContent = 'Perfect shelf. The shopkeeper nods approvingly.'; el('shelf-slots').classList.add('success-glow'); el('check-button').textContent = 'Next delivery  ->';
	el('check-button').onclick = () => { day += 1; storageSet('shelfDay', day); el('check-button').onclick = null; el('check-button').textContent = 'Unlock shelf  ->'; buildOrder(); }; updateStatus();
});
el('reset-button').addEventListener('click', () => { shelfOrder = Array(5).fill(null); bottles.forEach((bottle) => { bottle.floorX = 8 + Math.random() * 78; bottle.floorY = 10 + Math.random() * 50; bottle.rotation = -12 + Math.random() * 24; }); selectedBottle = null; renderShelf(); renderTray(); el('game-message').textContent = ''; });
el('capacity-upgrade').addEventListener('click', () => buyUpgrade('capacity'));
el('speed-upgrade').addEventListener('click', () => buyUpgrade('speed'));
el('map-button').addEventListener('click', () => buyUpgrade('map'));
el('recall-button').addEventListener('click', recallSameType);
buildOrder();
