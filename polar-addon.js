/* 북극곰 미션 추가용 - 기존 index.html의 </body> 바로 앞에
   <script src="polar-addon.js"></script> 를 추가하세요. */
(() => {
  missions.polar = {
    label: '북극곰',
    title: '🐻‍❄️ 마술연필로 아기 북극곰을 도와주세요!',
    guide: '큰 얼음 육지와 아기 북극곰의 얼음을 이어 주세요.',
    bg: 'polar-base.png',
    magic: '✨ 아기 북극곰을 도와주세요!',
    loading: '✨ 마술연필이 얼음을 이어 주고 있어요…',
    result: '🐻‍❄️ 아기 북극곰이 안전하게 돌아갈 수 있어요!'
  };

  const nav = document.querySelector('.nav');
  const polarTab = document.createElement('button');
  polarTab.id = 'polarTab';
  polarTab.textContent = '🐻‍❄️ 북극곰';
  nav.appendChild(polarTab);

  const originalApplyMission = applyMission;
  applyMission = function(m) {
    originalApplyMission(m);
    document.querySelector('#polarTab')?.classList.toggle('active', m === 'polar');
  };

  polarTab.onclick = () => applyMission('polar');
})();
