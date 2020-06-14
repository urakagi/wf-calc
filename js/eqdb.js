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
  // 属性、レアリティ絞り込みチェックボックス処理
  const allChecks = [$('#cond-all-elements'), $('#cond-all-rarities')];
  const allImgs = [$('.cond-element'), $('.cond-rarity')];

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
        $label.css('filter', 'opacity(0.3) grayscale(1)');
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

  // タイプ・入手方法絞り込みチェックボックス処理
  const $allBoxes = [$('#cond-all-types'), $('#cond-all-sources')];
  const $boxes = [$('.cond-type'), $('.cond-source')];

  for (let i = 0; i < $allBoxes.length; i++) {
    let $all = $allBoxes[i];
    let $box = $boxes[i];
    $all.change(function () {
      $box.prop('checked', $all.prop('checked'));
    });

    $box.change(function () {
      let allChecked = true;
      for (let i = 0; i < $box.length; i++) {
        if (!$box.eq(i).prop('checked')) {
          allChecked = false;
          break;
        }
      }
      $all.prop('checked', allChecked);
    });
  }
}

function exec() {
  const $result = $('#result');
  const $resultCount = $('#resultCount');
  $result.empty();
  $resultCount.empty();
  $('#conditions').accordion('option', {'active': false});

  let searchFixed = $('#cond-search').val().replace(/＋/g, '+').replace(/－/g, '-')
    .replace(/／/g, '/').replace(/％/g, '%').replace(/　/g, ' ').split(' ');

  const filters = {
    name: $('#cond-name').val().trim(),
    $element: $('.cond-element'),
    $type: $('.cond-type'),
    $rarity: $('.cond-rarity'),
    $source: $('.cond-source'),
    search: searchFixed,
    sw: [$('#cond-sw-min').val(), $('#cond-sw-max').val()],
    hit: [$('#cond-hit-min').val(), $('#cond-hit-max').val()],
    searchIn: [
      $('#cond-full').prop('checked'),
      $('#cond-soul').prop('checked')
    ]
  };

  let timeUsed = Date.now();
  let eqs = [];
  for (let i in equips) {
    const eq = equips[i];
    if (valid(eq, filters)) {
      eqs.push(eq);
    }
  }

  eqs = sortEquips(eqs);
  for (let i in eqs) {
    $result.append(makeResultEntry(eqs[i], searchFixed));
  }

  $resultCount.html(`${eqs.length} 件 (${((Date.now() - timeUsed) / 1000.0).toFixed(2)} 秒)`);
}

function valid(eq, filters) {
  // 名前
  if (filters.name.length > 0) {
    if (eq.name.indexOf(filters.name) < 0) {
      return false;
    }
  }

  // 属性、タイプ、レアリティ
  if (eq.element.length > 0) {
    if (!filters.$element.eq(ELEMENTS.indexOf(eq.element)).prop('checked')) {
      return false;
    }
  } else {
    if (!$('#cond-none').prop('checked')) {
      return false;
    }
  }
  if (!filters.$type.eq(EQUIP_TYPES.indexOf(eq.type)).prop('checked')) {
    return false;
  }
  if (!filters.$rarity.eq(5 - eq.star).prop('checked')) {
    return false;
  }

  // 入手方法
  const source = eq.source;
  if (source.indexOf('ボスコイン交換') >= 0) {
    if (!$('#cond-source-bc').prop('checked')) {
      return false;
    }
  } else if (source.indexOf('イベント') >= 0
    || source.indexOf('ミッション') >= 0
    || source.indexOf('ログイン') >= 0) {
    if (!$('#cond-source-events').prop('checked')) {
      return false;
    }
  } else if (source.indexOf('崩壊域') >= 0) {
    if (!$('#cond-source-deep').prop('checked')) {
      return false;
    }
  } else if (source.indexOf('装備ガチャ') >= 0) {
    if (!$('#cond-source-gacha').prop('checked')) {
      return false;
    }
  } else {
    if (!$('#cond-source-others').prop('checked')) {
      return false;
    }
  }

  // テキスト検索
  const targets = [
    eq.effect,
    eq.soul
  ];
  let found = false;
  for (let j = 0; j < filters.searchIn.length; j++) {
    if (filters.searchIn[j] && targets[j]) {
      let allFound = true;
      for (let k = 0; k < filters.search.length; k++) {
        if (targets[j].indexOf(filters.search[k]) < 0
        ) {
          allFound = false;
          break;
        }
      }
      if (allFound) {
        found = true;
      }
    }
  }
  return found;
}

function sortEquips(eqs) {
  // デフォルト順：属性→レアリティ→ATK
  eqs.sort((a, b) => {
    if (a.element !== b.element) {
      if (a.element.length == 0) {
        return 1;
      }
      if (b.element.length == 0) {
        return -1;
      }
      return ELEMENTS.indexOf(a.element) < ELEMENTS.indexOf(b.element) ? -1 : 1;
    }
    if (a.star !== b.star) {
      return b.star < a.star ? -1 : 1;
    }
    return b.atk - a.atk;
  });
  return eqs;
}

function makeResultEntry(eq, search) {
  const $ret = $('<div class="result-entry"></div>');

  const $line1 = $('<table class="line1"></table>');
  const $tr1 = $('<tr></tr>');
  $tr1.append($(`
    <td width="80" rowspan="2">
      <img class="eq-pic" src="img/eq/${eq.id}.jpg">
    </td>
  `));
  $tr1.append($(`
      <td class="names" colspan="2">
        <div class="name">${eq.name}</div>
      </td>
    `));
  if (eq.element.length > 0) {
    $tr1.append(`<td width="35" rowspan="2"><img class="element" src="${ELEMENT_PICS[eq.element]}"></td>`);
  }
  $line1.append($tr1);

  const $tr2 = $('<tr></tr>');
  $tr2.append(`<td class="eq-source">${eq.source}</td>`);
  $line1.append($tr2);
  $ret.append($line1);

  $ret.append($(
    `<table class="line2"><tr>
    <td width="80"><img class="star" src="img/star${eq.star}.png"></td>
    <td class="description">HP</td>
    <td>${eq.hp}</td>
    <td class="description">攻撃</td>
    <td>${eq.atk}</td>
    <td class="description">タイプ</td>
    <td width="100">${eq.type}</td>
  </tr></table>`));

  const $line3 = $('<p></p>');
  const [html, found] = emphasizeSearch(eq.effect, search);
  $line3.append($(`<table class="line3 ${found ? 'search-found' : ''}"><tr>
      <td>
        <div class="decoration">MAX効果</div>
        <div>${html}</div>
        </td>
    </tr></table>`));
  if (eq.soul) {
    const [html, found] = emphasizeSearch(eq.soul, search);
    $line3.append($(`<table class="line3 ${found ? 'search-found' : ''}"><tr>
      <td>
        <div class="decoration">ソウル効果</div>
        <div>${html}</div>
        </td>
    </tr></table>`));
  }
  $ret.append($line3);

  return $ret;
}

function emphasizeSearch(text, search) {
  let origin = text;
  let allFound = true;
  for (let i = 0; i < search.length; i++) {
    if (search[i].length > 0 && text.indexOf(search[i]) >= 0) {
      text = text.replace(new RegExp(escapeRegExp(search[i]), 'g'),
        `<span class="searched-text">${search[i]}</span>`);
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
  $('#sort-atk').prop('checked', true);
  $('#sort-desc').prop('checked', true);
  $('#result').empty();
  $('#resultCount').empty();
  $('#conditions').accordion('option', {'active': false});
  $('#conditions h3:eq(0)').click();
  $('#cond-name').focus();
}
