const END = 5000;
const ZOOM = 4;
const LINE_HEIGHT = 25;

$().ready(() => {
  insertChargeInputs();
  $('input, select').on('change', exec);
  exec();
});

let gSkillTimes;
let gChargeCount;

function insertChargeInputs() {
  const $chargeTable = $('#charge-table');
  let $tr;
  for (let i = 2; i >= 0; i--) {
    $tr = $(`<tr><td>＋ユニ${i+1}</td></tr>`);
    for (let j = 0; j < 3; j++) {
      $tr.append($(`<td class="charge">
        <input class="charge-${i}-${j}" size="2">%<br>
        <select class="charge-limit-${i}-${j}" tabindex="-1">
        </select>
        </td>`
      ));
      let $select = $tr.find(`select.charge-limit-${i}-${j}`);
      for (let k = 0; k <= 10; k++) {
        let text = k == 0 ? '∞' : k;
        $select.append($(`<option value="${k}">${text}回</option>`));
      }
    }
    $chargeTable.after($tr);
  }
  $tr = $('<tr><td>＋自身</td></tr>');
  for (let j = 0; j < 3; j++) {
    $tr.append($(`<td class="charge">
        <input class="charge-self-${j}" size="2">%<br>
        <select class="charge-self-limit-${j}" tabindex="-1">
        </select>
        </td>`
    ));
    let $select = $tr.find(`select.charge-self-limit-${j}`);
    for (let k = 0; k <= 10; k++) {
      let text = k == 0 ? '∞' : k;
      $select.append($(`<option value="${k}">${text}回</option>`));
    }
  }
  $chargeTable.after($tr);
}

function exec() {
  const $graph = $('#graph');
  gSkillTimes = [[], [], []];
  gChargeCount = [0, 0, 0];
  $graph.html('<tr></tr>');

  const sw = [];
  let gauge = [0, 0, 0];
  let order = [0, 0, 0];
  let time = 0;

  for (let i = 0; i < 3; i++) {
    sw[i] = (parseInt($('.sw1').eq(i).val()) + parseInt($('.sw2').eq(i).val())) / 2;
  }

  // Opening
  for (let i = 0; i < 3; i++) {
    let op = parseInt($('.opening').eq(i).val());
    if (!op) op = 0;
    gauge[i] += op * 0.01 * sw[i];
    if (gauge[i] >= sw[i]) {
      const g = useSkill(time, gauge, sw, i, order);
      gauge = g[0];
      order = g[1];
    }
  }

  // Start loop
  while (time < END) {
    time++;
    for (let i = 0; i < 3; i++) {
      if (sw[i] <= 0) {
        continue;
      }
      gauge[i]++;
      if (gauge[i] >= sw[i]) {
        const g = useSkill(time, gauge, sw, i, 0);
        gauge = g[0];
        order = g[1];
      }
    }
  }

  // Draw each union
  for (let i = 0; i < 3; i++) {
    const $union = $(`<div><div class="line-name">${$('.u-name').eq(i).val()}(${sw[i]})</div></div>`);
    let cursor = 0;
    let lastTop = 0;
    for (let j in gSkillTimes[i]) {
      let skillTime = gSkillTimes[i][j];
      const orderMark = order > 0 ? `(${order + 1})` : '';
      let gap = skillTime / ZOOM - cursor;
      if (gap > 0) {
        $union.append(`<div style="height: ${gap}px;"></div>`);
        cursor += gap;
        $union.append($(`<div class="line line${i}">${skillTime}${orderMark}</div>`));
        lastTop = cursor;
        cursor += LINE_HEIGHT;
      } else {
        // Line overlapped
        const $last = $union.find('.line:eq(-1)');
        if ($last.length > 0) {
          $last.html($last.html() + `, ${skillTime}${orderMark}`);
          let newBottom = skillTime / ZOOM + LINE_HEIGHT;
          $last.css('height', newBottom - lastTop);
          cursor = newBottom;
        } else {
          // Charge 100% first element
          $union.append($(`<div class="line line${i}">${skillTime}${orderMark}</div>`));
          lastTop = cursor;
          cursor += LINE_HEIGHT;
        }
      }

    }
    if (cursor < END) {
      $union.append(`<div style="height: ${(END - cursor) / ZOOM}px;"></div>`);
    }
    const $td = $('<td class="union"></td>');
    $td.append($union);
    $graph.children('tr').append($td);
  }
}

function useSkill(time, gauge, sw, i, order) {
  gSkillTimes[i].push(time);
  gauge[i] = 0;
  // Charge self
  {
    let chargeLimit = +$(`.charge-self-limit-${i}`).val();
    if (!chargeLimit) chargeLimit = 0;
    if (chargeLimit === 0 || gChargeCount[i] < chargeLimit) {
      let charge = +$(`.charge-self-${i}`).val();
      if (!charge) charge = 0;
      gauge[i] += Math.floor(charge * 0.01 * sw[i]);
    }
  }
  // Charge others
  for (let j = 0; j < 3; j++) {
    let chargeLimit = parseInt($(`.charge-limit-${j}-${i}`).val());
    if (!chargeLimit) chargeLimit = 0;
    if (chargeLimit === 0 || gChargeCount[i] < chargeLimit) {
      let charge = parseInt($(`.charge-${j}-${i}`).val());
      if (!charge) charge = 0;
      gauge[j] += Math.floor(charge * 0.01 * sw[j]);
    }
  }
  gChargeCount[i]++;
  for (let j = 0; j < 3; j++) {
    if (gauge[j] >= sw[j]) {
      console.log('order='+order)
      gauge = useSkill(time, gauge, sw, j, order + 1)[0];
    }
  }
  return [gauge, order];
}
