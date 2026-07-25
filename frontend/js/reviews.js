const REVIEWS = [
  { name: 'C Moor', meta: 'Local Guide · 61 reviews', text: 'Best place on the lake! Excellent service, even better food. Gluten-free friendly and they do lettuce wraps too — super accommodating.' },
  { name: 'MrBpritch100', meta: 'Local Guide · 80 reviews', text: 'Took the 2hr bike cruise out for a burger and poutine — hands down the best poutine I\'ve had in AB, and I\'m from the east coast.' },
  { name: 'Mike Chow', meta: 'Local Guide · 42 reviews', text: 'The poutine has real cheese curds! A summer-time treat with real ice cream milkshakes. Thanks Ben for the hospitality!' },
  { name: 'Kevin Sole', meta: 'Local Guide · 70 reviews', text: 'Wonderful food, fast service. Highly recommend stopping by for some great diner grub, whether you live nearby or not.' },
  { name: 'Corey Mcginn', meta: '4 reviews', text: 'Chef had an extra burger on the grill near closing and offered it up free so it wouldn\'t go to waste — even threw in cookies. Highly recommend!' },
  { name: 'Shirley Shimenosky', meta: '8 reviews', text: 'Efficient, friendly, respectable, excellent hot food, reasonably priced and clean. The cook even came out to check on customers.' },
  { name: 'Valere Piche', meta: '1 review', text: 'The home fries are awesome, so tasty — you\'ve got to have them!!' },
  { name: 'Tom Stogdale', meta: 'Local Guide · 108 reviews', text: 'Fab burger and a nice setting for sitting outside. Very friendly staff.' },
  { name: 'Don Gorman', meta: 'Local Guide · 108 reviews', text: 'Old-school window service and hospitality, with a free extra sauce from the owner. Thanks for a great breakfast!' },
  { name: 'Colby Churko', meta: '5 reviews', text: 'Great milkshakes, and the poutine is to die for.' }
];

const revTrack = document.getElementById('revTrack');
revTrack.innerHTML = REVIEWS.map(r => `
  <div class="rev-card">
    <span class="stars">★★★★★</span>
    <p class="quote">"${r.text}"</p>
    <div class="who">
      <div class="rev-avatar">${r.name.charAt(0)}</div>
      <div>
        <div class="name">${r.name}</div>
        <div class="meta">${r.meta}</div>
      </div>
    </div>
  </div>
`).join('');

document.getElementById('revPrev').addEventListener('click', () => revTrack.scrollBy({ left: -320, behavior: 'smooth' }));
document.getElementById('revNext').addEventListener('click', () => revTrack.scrollBy({ left: 320, behavior: 'smooth' }));
