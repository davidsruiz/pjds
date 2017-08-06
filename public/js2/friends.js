'use strict';

function listHistory(callback) {
  var pp = ENV.storage.previous_players;
  if (pp) {
    pp = JSON.parse(pp);

    $.ajax({
      url: '/online_status',
      type: 'POST',
      data: JSON.stringify({ history: pp }),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json'
    }).done(function (list) {
      list = list.reverse();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var user = _step.value;

          var a = document.createElement('a');a.href = location.origin + '/' + user[1];
          var span = document.createElement('span');span.className = 'mi';span.textContent = user[0];

          a.appendChild(span);

          $('.menu').append(a);

          // <a href="/friends"><input type="submit" value="with friends"></a>

          console.log(user);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      callback();
    });
  }
}

$(function () {
  listHistory(function () {

    $('.mi:not([disabled])').mouseover(function (jqEvent) {
      $('.mi').removeClass('selected');
      var span = jqEvent.currentTarget;
      span.classList.add('selected');
      ENV.sound.play('item-hover');
    });
    $('.mi:not([disabled])').mouseout(function (jqEvent) {
      var span = jqEvent.currentTarget;
      span.classList.remove('selected');
    });
  });
});