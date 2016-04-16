(function() {
  'use strict';

  const s = Snap('#main');
  const W = 800;
  const H = 800;
  const CX = W/2;
  const CY = H/2;
  const PI = Math.PI;
  const PI2 = 2 * PI;
  // scene r
  const SR = 300;
  const cos = Math.cos;
  const sin = Math.sin;

  let Paper, Element;

  Snap.plugin((_Snap, _Element, _Paper, _global) => {
    Element = _Element;
    Paper = _Paper;
  });

  window.s = s;

  class People {
    constructor(svg) {
      this.el = svg.clone().appendTo(s);

      var self = proxyEl(this);

      self.reset();
      self.click(() => self.defend());
      return self;
    }

    reset() {
      this.el.stop();
      this.el.attr({
        x: CX,
        y: CY,
        width: 100,
        height: 100
      })
    }

    attack(people) {
      var line = s.paper.line(this.attr('x'), this.attr('y'), people.attr('x'), people.attr('y'));
      line.attr({
        stroke: '#000',
        'stroke-width': '1px'
      });

      setTimeout(() => line.remove(), 1000);
    }

    attackAll() {
      People.peoples.forEach(people => {
        if (people === this) return;
        this.attack(people);
      });
    }

    defend() {
      new Shield(Shield.fragments.shield).defendFor(people);
    }
  }

  People.prototype.peoples = People.peoples = {};

  class Shield {
    constructor(name, svg) {
      this.el = svg;

      var self = proxyEl(this);

      console.log(self);
    }

    defendFor(people) {
      var shield = this.el.clone();
      shield.appendTo(s);
      shield.attr({
        x: people.attr('x'),
        y: people.attr('y'),
        width: 100,
        height: 100
      });
      setTimeout(() => {
        shield.remove()
      },1000);
    }
  }

  Shield.shields = Shield.prototype.shields = {};

  function proxyEl(self) {
    return new Proxy(self, {
      get: (target, property) => {
        if (property in target) return target[property];
        else return target.el[property];
      }
    })
  }

  function init(fragments) {
    console.log(fragments);
    People.fragments = fragments.peoples;
    Shield.fragments = fragments.shields;

    document.getElementById('handle').addEventListener('click', (e) => {
      People.peoples[Date.now()] = new People(fragments.peoples.people);
      refreshPeople();
    });
  }

  function initError(err) {
    console.error(err);
  }

  function load(loadList) {
    return Promise.props(_.mapValues(loadList, (value, key) => {
      let loads = {};
      for (let url of value) {
        loads[url] = _load('svg/' + url + '.svg');
      }
      return Promise.props(loads);
    }))
  }

  function _load(url) {
    return new Promise((resolve, reject) => {
      Snap.load(url, f => {
        resolve(f.select('svg'));
      });
    });
  }

  function refreshPeople() {
    let peoples = People.peoples;
    let size = peoples.length;
    let unit = PI2 / size;

    _.forEach(peoples, (people, index) => {
      console.log(index, people);
      // people.reset();
      people.animate({
        x: CX + SR * cos(unit * index),
        y: CY + SR * sin(unit * index)
      }, 1000);
    })
  }

  Promise
  .all([
    load({
      peoples: ['people'],
      shields: ['shield']
    })
  ])
  .spread(init)
  .catch(initError)

  var border = s.rect(0,0,800,800);
  border.attr({
    fill: '#ffffff',
    stroke: '#000000',
    'stroke-width': '1px'
  });

  let group = s.g(
    s.paper.circle(0,0,50).attr({'fill': '#fff', 'stroke': '#000', 'stroke-width': '10px'}),
    s.paper.text(0, 0, '1').attr({'font-size': '60px', dx: '-14px', dy: '18px'})
    );
  group.appendTo(s);
})()