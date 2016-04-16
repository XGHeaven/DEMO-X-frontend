(function() {
  'use strict';

  const s = Snap('#main');
  const W = 1000;
  const H = 800;
  const CX = W/2;
  const CY = H/2;
  const PI = Math.PI;
  const PI2 = 2 * PI;
  // scene r
  const SRX = CX - 100;
  const SRY = CY - 100;
  const cos = Math.cos;
  const sin = Math.sin;

  const UM = () => new Snap.Matrix(1,0,0,1,0,0);

  const COLOR_DEAD = '#aaa';

  // const io = window.io('ws://139.129.24.151:3000');

  let Paper, Element;
  const paper = s.paper;

  Snap.plugin((_Snap, _Element, _Paper, _global) => {
    Element = _Element;
    Paper = _Paper;
  });

  window.s = s;

  class People {
    constructor(id, name = 'NEED FATHER') {
      this.pow = 0;
      this.uid = id;

      let gCircle = paper
      .circle(0, 0, 50)
      .attr({
        'fill-opacity': 0,
        'stroke-width': 3
      });
      let gPower = paper
      .text(0 ,0, this.pow.toString())
      .attr({
        'font-size': 60,
        dx: -18,
        dy: 18
      });
      let gName = paper
      .text(0, 80, name)
      .attr({
        'font-size': 20,
        'text-anchor': 'middle'
      });
      let group = paper.g(gCircle, gPower, gName);
      group.attr({
        stroke: '#000'
      });

      this.el = group;
      this.gCircle = gCircle;
      this.gPower = gPower;
      this.gName = gName;
      this.state = 'normal';

      this.el.remove();

      var self = proxyEl(this);

      self.reset();
      self.click(() => {
        self.clear();
      });
      return self;
    }

    static add(id, name = 'NEED MOTHER') {
      let people = new People(id, name);
      people.reset()
      people.attach();
      console.log(People.peoples)
      panel.addUser();
    }

    attach() {
      this.el.appendTo(s);
      People.peoples.push(this);
      return this;
    }

    clear() {
      People.peoples.splice(People.peoples.indexOf(this), 1);
      this.remove();
      refreshPeople();
    }

    move(x, y, time = 0) {
      let m = UM();
      if (x === 'center') {
        m.translate(CX, CY);
      } else if (typeof x === 'number' || typeof y === 'number') {
        m.translate(x, y);
      } else {
        throw new Error('x or y is illeagl');
      }
      this.matrix = m;

      if (time) {
        return this.animate({
          transform: m
        }, time);
      }

      return this.attr({
        transform: m
      });
    }

    reset() {
      this.stop();
      this.move('center');
      return this;
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

    power(number) {
      if (number === void 0) {
        return this.pow;
      }
      this.pow = number;
      this.gPower.node.innerHTML = this.pow;
      return this;
    }

    setState(state) {
      if (state === this.state) return;
      switch(state) {
      case 'normal':
        this._normalState();
        break;
      case 'action':
        this._actionState();
        break;
      case 'damage':
        this._damageState();
        break;
      case 'dead':
        this._deadState();
        break;
      default:
      }
    }

    _deadState() {
      this.el.animate({
        fill: COLOR_DEAD,
        stroke: COLOR_DEAD
      }, 300);
    }

    _actionState() {
      this.gCircle.attr({class:'people-action'})
      this.gCircle.animate({
        stroke: '#009900'
      },1000);
    }

    _damageState() {
      this.gCircle.animate({
        'stroke-width': 10,
        'stroke': '#990000'
      }, 200, () => {
        this.gCircle.animate({
          'stroke-width': 3,
          'stroke': '#000'
        }, 1500)
      });

      this.gPower.animate({
        transform: UM().scale(1.5,1.5)
      }, 200, () => {
        this.gPower.animate({
          transform: UM()
        }, 200);
      })
    }
  }

  People.peoples = [];

  window.round = new (class Round {
    constructor() {
      let text = paper.text(CX, CY, 'Round 1');
      let block = paper.rect(0,0,W,H);
      let group = paper.g(block, text);
      group.attr({
        class: 'round'
      });
      this.el = group;
      this.el.remove();
      this.round = 0;

      let self = proxyEl(this);
      return self;
    }

    hide(cb) {
      this.animate({
        opacity: 0
      }, 500, () => {
        this.el.remove();
        cb && cb();
      })
    }

    show(cb) {
      this.attr({
        opacity: 0,
        transform: UM().scale(3,3,CX,CY)
      });
      this.select('text').node.innerHTML = 'Round ' + this.round;
      this.el.appendTo(s);
      this.animate({
        opacity: 1,
        transform: UM()
      }, 500, mina.bounce, () => {
        cb && cb();
      });
    }

    nextRound(cb) {
      this.round ++;
      this.show();
      setTimeout(() => {
        this.hide(cb);
      }, 2000);
    }
  })

  const timer = new (class Timer {
    constructor() {
      let text = paper.text(CX, CY, 'X');
      text.attr({
        'text-anchor': 'middle',
        'font-size': 100,
        dy: 30
      });
      this.el = text;
      this.el.remove();

      let self = proxyEl(this);
      return self;
    }

    hide() {
      this.el.remove();
    }

    show() {
      this.el.appendTo(s);
    }

    reset() {
      this.el.node.innerHTML = 'X';
      this.attr({
        transform: UM(),
        fill: ''
      });
    }

    setTime(time) {
      this.el.node.innerHTML = time;
      if (time < 10) {
        this.animate({
          transform: UM().scale(2, 2, CX, CY),
          fill: '#330000',
        }, 500, () => {
          if (time > 0) {
            this.animate({
              transform: UM(),
              fill: ''
            }, 100);
          } else {
            this.animate({
              transform: UM().scale(0, 0, CX, CY),
              fill: ''
            }, 200, () => {
              this.hide();
              this.reset();
            })
          }
        });
      }
    }
  });

  const panel = new (class Panel {
    constructor() {
      this.total = 0;
      this.alive = 0;
      this.el = paper.group(
        this.gTotal = paper.text(0,10,'Total: ' + this.total + ' 人'),
        this.gAlive = paper.text(0,60,'Alive: ' + this.alive + ' 人')
      ).attr({
        class: 'panel'
      })
      this.el.remove();
    }

    show() {
      this.el.appendTo(s);
    }

    hide() {
      this.el.remove();
    }

    refresh() {
      this.gTotal.node.innerHTML = 'Total: ' + this.total + ' 人';
      this.gAlive.node.innerHTML = 'Alive: ' + this.alive + ' 人';
    }

    addUser() {
      this.total++;
      this.alive++;
      this.refresh();
    }

    deadUser() {
      this.dead++;
      this.refresh();
    }
  });

  const state = new (class Status {
    constructor() {
      let text = paper.text(W, 10, 'STATUS');
      text.remove();
      text.attr({
        class: 'state'
      })
      this.el = text;
      this.state = 'none';
    }

    setState(s) {
      if (s !== this.state) this.leaveState(this.state);
      this.state = s;
      switch(s) {
        case 'welcome':
        showWelcome();
        break;
        // waiting start
        case 'waiting':
        timer.show();
        panel.show();
        this.show('等待用户加入');
        let time = 10;
        setTimeout(function st() {
          timer.setTime(time);
          if (time > 0) {
            time--;
            setTimeout(st, 1000);
          } else {
            state.setState('action');
          }
        }, 1000);
        break;
        case 'cooldown':
        this.text('请说出指令');
        round.nextRound(() => {
          timer.show();
          let time = 10;
          setTimeout(function st() {
            timer.setTime(time);
            if (time > 0) {
              time--;
              setTimeout(st, 1000);
            } else {
              state.setState('end');
            }
          }, 1000);
        });
        break;
        case 'action':
        this.text('决战中...');
        break;
        case 'end':
        panel.hide();
        this.hide();
        // showWinner();
        break;
        default:
      }
    }

    leaveState(s) {
      switch(s) {
        case 'welcome':
        break;
        case '':
        break;
      }
    }

    show(t) {
      if (t) this.text(t);
      this.el.appendTo(s);
    }

    hide() {
      this.el.remove();
    }

    text(t) {
      this.el.node.innerHTML = t;
    }
  })

  function proxyEl(self) {
    return new Proxy(self, {
      get: (target, property) => {
        if (property in target) return target[property];
        else return target.el[property];
      }
    })
  }

  function init(fragments) {
    document.getElementById('handle').addEventListener('click', (e) => {
      // if (state.state !== 'waiting') return;
      People.add(Date.now());
      refreshPeople();
    });

    // state.setState('welcome');
    state.setState('none');
  }

  function showWelcome() {
    let title = createTitle('闷声发大财');
    let remark = createRemark();
    let startButton = createButton(CX,CY, 300, 150, 10, 10, 'BEGIN', () => {
      startButton.animate({
        opacity: 0
      }, 500, () => {
        title.animate({
          opacity: 0
        }, 500, () => {
          startButton.remove();
          title.remove();
          startButton = title = null;
          state.setState('waiting');
        });
      });
      remark.animate({
        opacity: 0
      }, 600, () => {
        remark.remove();
        remark = null;
      });
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

    peoples.forEach((people, index) => {
      people.move(CX + SRX * cos(unit * index), CY + SRY * sin(unit * index), 500);
    })
  }

  function createButton(cx,cy,w,h,rx,ry,t,cb) {
    const button = paper.rect(cx-w/2,cy-h/2,w,h,rx,ry);
    const text = paper.text(cx,cy,t);
    const group = paper.g(button, text);

    text.attr({
      dy: 18
    })

    group.attr({
      class: 'button'
    })
    group.click(cb);

    group.appendTo(s);

    return group;
  }

  function createTitle(text) {
    const texts = paper.g(
      paper.text(CX, 200, text),
      paper.text(CX, 200, text),
      paper.text(CX, 200, text),
      paper.text(CX, 200, text)
    );

    texts.appendTo(s);

    texts.attr({
      class: 'title'
    })

    return texts;
  }

  function createRemark() {
    const text = paper.text(CX, 600, 'Power By XGHeaven,XANA,hakureisino,JK');
    text.attr({
      'font-size': 40,
      'text-anchor': 'middle'
    });
    return text;
  }

  Promise
  .all([
    // load({
    //   peoples: ['people'],
    //   shields: ['shield']
    // })
  ])
  .spread(init)
  .catch(initError)

  var border = s.rect(0,0,800,800);
  border.attr({
    fill: '#ffffff',
    opacity: 0,
    stroke: '#000000',
    'stroke-width': '1px'
  });

  setTimeout(() => {
    // new People(2).reset().attach().setState('dead');
  }, 2000);

  // io.on('message', (data) => {

  // });

  // io.on('members', data => {

  // });

  // io.on('time', data => {

  // });
})()