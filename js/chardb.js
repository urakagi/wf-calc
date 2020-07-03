$(function () {
  $('#conditions').accordion({
    collapsible: true
  });
});

$().ready(() => {
  $('#conditions').find('input').on('keypress', (ev) => {
    if (ev.which === 13) {
      exec();
    }
  });

  initCheckboxes();
  $('#cond-name').focus();
});

function initCheckboxes() {
  // 属性、タイプ絞り込みチェックボックス処理
  const allChecks = [$('#cond-all-elements'), $('#cond-all-types'), $('#cond-all-rarities')];
  const allImgs = [$('.cond-element'), $('.cond-type'), $('.cond-rarity')];

  for (let task = 0; task < allChecks.length; task++) {
    const $all = allChecks[task];
    const $boxes = allImgs[task];

    $all.on('change', function () {
      $boxes.prop('checked', $(this).prop('checked'));
      $boxes.change();
    });

    $boxes.on('change', function () {
      const $this = $(this);

      // 全チェックから一つクリックした時、これだけ消すではなくこれだけ残る使い方が多いので特例処理
      if ($all.prop('checked') && !$this.prop('checked')) {
        $all.prop('checked', false);
        for (let i = 0; i < $boxes.length; i++) {
          $boxes.eq(i).prop('checked', false);
        }
        $this.prop('checked', true);
        $boxes.change();
      }

      const $label = $(`label[for=${this.id}]`);
      if ($this.prop('checked')) {
        $label.css('filter', 'opacity(1)');
      } else {
        $all.prop('checked', false);
        if (task === 1) {
          $label.css('filter', 'opacity(0.2)');
        } else {
          $label.css('filter', 'opacity(0.3) grayscale(1)');
        }
      }
      let allUnchecked = true;
      let allChecked = true;
      for (let i = 0; i < $boxes.length; i++) {
        if ($boxes.eq(i).prop('checked')) {
          allUnchecked = false;
        } else {
          allChecked = false;
        }
      }
      $all.prop('checked', allChecked);
    });
  }

  // 種族絞り込みチェックボックス処理
  const $races = $('.cond-race');
  const $allRaces = $('#cond-all-races');

  $allRaces.change(function () {
    $races.prop('checked', $allRaces.prop('checked'));
  });

  $races.change(function () {
    let allChecked = true;
    for (let i = 0; i < $races.length; i++) {
      if (!$races.eq(i).prop('checked')) {
        allChecked = false;
        break;
      }
    }
    $allRaces.prop('checked', allChecked);
  });

  // スキアビ絞り込みチェックボックス処理
  const $searchTargets = $('.search-target').find('input:checkbox');

  $('#cond-all-targets').change(function () {
    $searchTargets.prop('checked', $('#cond-all-targets').prop('checked'));
  });

  $searchTargets.change(function () {
    let allChecked = true;
    for (let i = 0; i < $searchTargets.length; i++) {
      if (!$searchTargets.eq(i).prop('checked')) {
        allChecked = false;
        break;
      }
    }
    $('#cond-all-targets').prop('checked', allChecked);
  });

  // 表示項目
  $('.columns').find('input[type=checkbox]').on('change', function () {
    $('#preset-custom').prop('checked', true);
  });
  $('#preset-full').on('change', function () {
    if (this.checked) {
      $('.columns').find('input[type=checkbox]').prop('checked', true);
    }
  });
  $('#preset-only-names').on('change', function () {
    if (this.checked) {
      $('.columns').find('input[type=checkbox]').prop('checked', false);
    }
  });
}

function exec() {
  const $result = $('#result');
  const $resultCount = $('#resultCount');
  $result.empty();
  $resultCount.empty();
  $('#conditions').accordion('option', {'active': false});

  let searchFixed = $('#cond-search').val().replace(/＋/g, '+').replace(/－/g, '-')
    .replace(/／/g, '/').replace(/％/g, '%').replace(/　/g, ' ').replace(/！/g, '!').split(' ');

  const filters = {
    name: $('#cond-name').val().trim(),
    $element: $('.cond-element'),
    $type: $('.cond-type'),
    $race: $('.cond-race'),
    $rarity: $('.cond-rarity'),
    search: searchFixed,
    sw: [$('#cond-sw-min').val(), $('#cond-sw-max').val()],
    hit: [$('#cond-hit-min').val(), $('#cond-hit-max').val()],
    searchIn: [
      $('#cond-skill').prop('checked'),
      $('#cond-leader').prop('checked'),
      $('#cond-a1').prop('checked'),
      $('#cond-a2').prop('checked'),
      $('#cond-a3').prop('checked')
    ]
  };

  const shows = {
    pic: $('#show-pic').prop('checked'),
    nickname: $('#show-nickname').prop('checked'),
    element: $('#show-element').prop('checked'),
    type: $('#show-type').prop('checked'),
    line2: $('#show-line2').prop('checked'),
    skillDesc: $('#show-skill-desc').prop('checked'),
    sw: $('#show-sw').prop('checked'),
    hit: $('#show-hit').prop('checked'),
    ls: $('#show-ls').prop('checked'),
    abilities: [
      $('#show-a1').prop('checked'),
      $('#show-a2').prop('checked'),
      $('#show-a3').prop('checked')
    ]
  };

  let timeUsed = Date.now();
  let chars = [];
  for (let i in characters) {
    const char = characters[i];
    if (valid(char, filters)) {
      chars.push(char);
    }
  }

  chars = sortChars(chars);
  for (let i in chars) {
    $result.append(makeResultEntry(chars[i], shows, searchFixed));
  }

  $resultCount.html(`${chars.length} 件 (${((Date.now() - timeUsed) / 1000.0).toFixed(2)} 秒)`);
}

function valid(char, filters) {
  // 名前
  if (filters.name.length > 0) {
    if (char.name.indexOf(filters.name) < 0) {
      return false;
    }
  }

  // 属性、タイプ、種族、レアリティ
  if (!filters.$element.eq(ELEMENTS.indexOf(char.element)).prop('checked')) {
    return false;
  }
  if (!filters.$type.eq(PF_TYPES.indexOf(char.type)).prop('checked')) {
    return false;
  }
  const races = char.race.split('/');
  let hitRace = false;
  for (let i in races) {
    if (filters.$race.eq(RACES.indexOf(races[i])).prop('checked')) {
      hitRace = true;
      break;
    }
  }
  if (!hitRace) {
    return false;
  }
  if (!filters.$rarity.eq(5 - char.star).prop('checked')) {
    return false;
  }

  // スキルウェイト・最大ヒット数
  let rangeChecks = [filters.sw, filters.hit];
  let rangeObjects = [char.sw, char.hit];
  for (let i = 0; i < rangeChecks.length; i++) {
    let min = parseInt(rangeChecks[i][0]);
    let max = parseInt(rangeChecks[i][1]);
    if (Number.isNaN(min)) {
      min = 0;
    }
    if (Number.isNaN(max)) {
      max = 9999;
    }
    if (rangeObjects[i] > max || rangeObjects[i] < min) {
      return false;
    }
  }

  // 最大ヒット数
  let hitMin = parseInt(filters.hit[0]);
  let hitMax = parseInt(filters.hit[1]);
  if (Number.isNaN(hitMin)) {
    hitMin = 0;
  }
  if (Number.isNaN(hitMax)) {
    hitMax = 9999;
  }
  if (char.hit > hitMax || char.hit < hitMin) {
    return false;
  }

  // スキアビ検索
  const targets = [
    char.skill,
    char.leader,
    char.abilities[0],
    char.abilities[1],
    char.abilities[2]
  ];
  let found = false;
  for (let j = 0; j < filters.searchIn.length; j++) {
    if (filters.searchIn[j] && targets[j]) {
      let allFound = true;
      for (let k = 0; k < filters.search.length; k++) {
        let term = filters.search[k];
        if (term[0] == '!') {
          if (targets[j].indexOf(term.substring(1)) >= 0) {
            allFound = false;
            break;
          }
        } else {
          if (targets[j].indexOf(term) < 0) {
            allFound = false;
            break;
          }
        }
      }
      if (allFound) {
        found = true;
      }
    }
  }
  return found;
}

function sortChars(chars) {
  // デフォルト順：属性→レアリティ→名前
  chars.sort((a, b) => {
    if (a.element !== b.element) {
      return ELEMENTS.indexOf(a.element) < ELEMENTS.indexOf(b.element) ? -1 : 1;
    }
    if (a.star !== b.star) {
      return b.star < a.star ? -1 : 1;
    }
    return a.name < b.name ? -1 : 1;
  });
  return chars;
}

function makeResultEntry(char, shows, search) {
  const $ret = $('<div class="result-entry"></div>');

  // 名前のみ特殊処理
  if ($('#preset-only-names').prop('checked')) {
    $ret.append(`<div>[${char.nickname}]${char.name}</div>`);
    return $ret;
  }

  const $line1 = $('<table class="line1"></table>');
  const $tr1 = $('<tr></tr>');
  if (shows.pic) {
    $tr1.append($(`
      <td width="80">
        <img class="char-pic" src="https://urakagi.github.io/wf-calc/img/char/${char.id}.jpg">
      </td>
    `));
  }
  $tr1.append($(`
      <td class="names">
        <div class="nickname">${char.nickname}</div>
        <div class="name">${char.name}</div>
      </td>
    `));
  if (!shows.nickname) {
    $tr1.find('.nickname').hide();
  }
  if (shows.element) {
    $tr1.append(`<td width="35"><img class="element" src="${ELEMENT_PICS[char.element]}"></td>`);
  }
  if (shows.type) {
    $tr1.append(`<td width="35"><img class="pf-type" src="${TYPE_PICS[char.type]}"></td>`);
  }
  $line1.append($tr1);
  $ret.append($line1);
  if (shows.line2) {
    const ext = char.id < 186 ? 'jpg' : 'png';
    $ret.append($(
      `<table class="line2"><tr>
      <td width="80"><img class="star" src="https://urakagi.github.io/wf-calc/img/star${char.star}.${ext}"></td>
      <td class="description">HP</td>
      <td>${char.hp}</td>
      <td class="description">攻撃</td>
      <td>${char.atk}</td>
      <td class="description">種族</td>
      <td class="race" width="70px;">${char.race}</td>
    </tr></table>`));
  }
  const $line3 = $('<p></p>');
  if (shows.ls && char.leader.length > 0) {
    const [html, found] = emphasizeSearch(char.leader, search);
    $line3.append(`<table class="line3 ${found ? 'search-found' : ''}"><tr>
      <td>
        <div class="decoration">リーダー特性</div>
        <div>${html}</div>
      </td>
      </tr></table>`
    );
  }
  const $skillTable = $(`<table class="line3"></table>`);
  if (shows.skillDesc) {
    const [html, found] = emphasizeSearch(char.skill, search);
    if (found) {
      $skillTable.addClass('search-found');
    }
    $skillTable.append(`<tr>
    <td colspan="2">
      <div class="decoration">スキル</div>
      <div>${html}</div>
    </td> </tr>`);
  }
  const $skilltr2 = $('<tr></tr>');
  if (shows.sw) {
    $skilltr2.append(`<td>
      <div class="decoration">スキルウェイト</div>
      <div>${char.sw}</div>
    </td>`);
  }
  if (shows.hit) {
    $skilltr2.append(`<td>
      <div class="decoration">最大ヒット数</div>
      <div>${char.hit}</div>
    </td>`);
  }
  if (shows.sw || shows.hit) {
    $skillTable.append($skilltr2);
  }
  $line3.append($skillTable);
  for (let i = 0; i < char.abilities.length; i++) {
    if (char.abilities[i] && shows.abilities[i]) {
      const [html, found] = emphasizeSearch(char.abilities[i], search);
      $line3.append($(`<table class="line3 ${found ? 'search-found' : ''}"><tr>
        <td>
          <div class="decoration">アビリティ${i + 1}</div>
          <div>${html}</div>
          </td>
      </tr></table>`));
    }
  }
  $ret.append($line3);
  return $ret;
}

function emphasizeSearch(text, search) {
  let origin = text;
  let allFound = false;
  for (let i = 0; i < search.length; i++) {
    if (search[i][0] == '!') {
      continue;
    }
    if (search[i].length > 0 && text.indexOf(search[i]) >= 0) {
      text = text.replace(new RegExp(escapeRegExp(search[i]), 'g'),
        `<span class="searched-text">${search[i]}</span>`);
      allFound = true;
    } else {
      allFound = false;
      break;
    }
  }
  return [allFound ? text : origin, allFound];
}

function reset() {
  $('input').val('');
  $('input[type=checkbox]').prop('checked', true);
  $('input[type=checkbox]').change();
  $('#preset-full').prop('checked', true);
  $('#result').empty();
  $('#resultCount').empty();
  $('#conditions').accordion('option', {'active': false});
  $('#conditions h3:eq(0)').click();
  $('#cond-name').focus();
}

