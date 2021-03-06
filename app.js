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
  const SPRITE = 6;

  // invert color
  const INVERT = false;

  const UM = () => new Snap.Matrix(1,0,0,1,0,0);

  const COLOR_DEAD = '#999';

  window.io = window.io('ws://192.168.200.163:3000');

  let Paper, Element;
  const paper = s.paper;

  Snap.plugin((_Snap, _Element, _Paper, _global) => {
    Element = _Element;
    Paper = _Paper;
  });

  Element.prototype.size = function() {
    let m = this.transform().localMatrix;
    let box = this.getBBox();
    return {
      x: m.x(box.x, box.y),
      y: m.y(box.x, box.y)
    }
  }

  window.s = s;

  window.People = class People {
    constructor(id, name = 'NEED FATHER') {
      this.pow = 0;
      this.uid = id;

      let gCircle = paper
      .circle(0, 0, 50)
      .attr({
        'fill-opacity': 0,
        'stroke-width': 3,
        'stroke': '#fff'
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
        'font-size': 30,
        'text-anchor': 'middle',
        'font-weight': 'bold'
      });
      // let gShield = paper .circle(0, 0, 50) .attr({
      //   kkkk
      // })
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
        self.attackAll();
      });
      return self;
    }

    static add(id, name = 'NEED MOTHER') {
      let people = new People(id, name);
      people.reset()
      people.attach();
      panel.addUser();
      refreshPeople();
    }

    static do(commands, cb) {
      let deaders = [];
      commands.forEach(command => {
        let people = _.find(People.peoples, (people) => people.uid === command.id);
        people.power(command.power);
        command.isDead && deaders.push(people);
        people.level = command.level;
        people.action = command.status;
        if (people.action === 'defend') people.defend();
      });

      let peoples = People.peoples.filter(people => people.state !== 'dead');
      panel.alive = peoples.length;
      panel.refresh();
      let actions = [];
      let attackers = peoples.filter(attacker => attacker.action === 'attack');
      let others = peoples.filter(other => other.action !== 'attack');
      let alls = attackers.concat(others);

      console.log(attackers, others, alls);

      for (let i = 0; i < attackers.length; i++) {
        let people = alls[i];
        for (let j = i+1; j < alls.length; j++) {
          let other = alls[j];
          let sa = people.action;
          let sb = other.action;
          console.log(i,j,sa,sb);
          if (sa === 'attack' && sb === 'attack') {
            if (people.level === other.level) actions.push(People.fair(people, other))
            else if (people.level < other.level) actions.push(People.crash(other, people))
            else actions.push(People.crash(people, other));
          } else if (sa === 'attack' && sb === 'power') {
            actions.push(People.harm(people, other));
          } else if (sa === 'power' && sb === 'attack') {
            actions.push(People.harm(other, people));
          } else if (sa === 'attack' && sb === 'defend' || sa === 'defend' && sb === 'attack') {
            if (people.level === other.level) {
              if (sa === 'attack') {
                actions.push(People.attack(people, other));
              } else {
                actions.push(People.attack(other, people));
              }
            } else if (people.level > other.level) {
              if (sa === 'attack') {
                actions.push(People.boom(people, other))
              } else {
                actions.push(People.boom(other, people))
              }
            } else {
              if (sa === 'attack') {
                actions.push(People.attack(people, other))
              } else {
                actions.push(People.attack(other, people))
              }
            }
          }
        }
      }

      deaders.forEach(deader => deader.setState('dead'));

      cb();
    }

    // 攻击相互抵消
    static fair(pa, pb) {
      let posa = pa.size();
      let posb = pb.size();

      let xmid = (posa.x + posb.x) / 2;
      let ymid = (posa.y + posb.y) / 2;

      return Promise.all([
        shot(posa.x, posa.y, xmid, ymid, pa.level-1 || 0),
        shot(posb.x, posb.y, xmid, ymid, pb.level-1 || 0)
      ]);
    }

    // 攻击穿透
    static crash(pa, pb) {
      let posa = pa.size();
      let posb = pb.size();

      let xmid = (posa.x + posb.x) / 2;
      let ymid = (posa.y + posb.y) / 2;

      return Promise.all([
        shot(posa.x, posa.y, xmid, ymid, pa.level-1 || 0),
        shot(posb.x, posb.y, xmid, ymid, pb.level-1 || 0)
      ]).then(() => shot(xmid, ymid, posb.x, posb.y, pa.level-1 || 0));
    }

    // 直接攻击伤害
    static harm(pa, pb) {
      return People.attack(pa,pb).then(() => {
        pb.damage();
      })
    }

    static attack(pa, pb) {
      let posa = pa.size();
      let posb = pb.size();

      return Promise.all([
        shot(posa.x, posa.y, posb.x, posb.y, pa.level-1 || 0)
      ]);
    }

    static boom(pa, pb) {
      return People.attack(pa,pb).then(() => {
        console.log(2);
      })
    }

    attach() {
      if (this.state === 'dead') return;
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
      if (this.state === 'dead') return;
      let s1 = this.size();
      let s2 = people.size();
      var line = shot(s1.x, s1.y, s2.x, s2.y,1,() => {});
    }

    attackAll() {
      if (this.state === 'dead') return;
      People.peoples.forEach(people => {
        if (people === this) return;
        this.attack(people);
      });
    }

    defend() {
      this.gCircle.animate({
        stroke: 'blue',
        'stroke-width': 15
      }, 300, mina.debounce, () => {
        setTimeout(() => this.gCircle.animate({
          stroke: 'white',
          'stroke-width': 3
        }, 300), 1000);
      })
    }

    power(number) {
      if (number === void 0) {
        return this.pow;
      }
      if (number === this.pow) return number;
      if (this.state === 'dead') return;

      let changeColor;

      if (number > this.pow) {
        changeColor = 'green';
      } else {
        changeColor = 'brown';
      }

      this.gCircle.animate({
        fill: changeColor,
        'fill-opacity': 1
      }, 300, mina.easein, () => {
        this.gCircle.animate({
          fill: '#000',
          'fill-opacity': 0
        }, 1000);
      });

      this.pow = number;
      this.gPower.node.innerHTML = this.pow;
      return this;
    }

    setState(state) {
      if (this.state === 'dead') return;
      if (state === this.state) return;
      switch(state) {
      case 'normal':
        this._normalState();
        break;
      case 'action':
        this._actionState();
        break;
      case 'dead':
        this._deadState();
        break;
      default:
      }
      this.state = state;
    }

    _deadState() {
      this.attr({
        class: 'dead'
      });
      panel.deadUser();
    }

    _actionState() {
      this.gCircle.attr({class:'people-action'})
      this.gCircle.animate({
        stroke: '#009900'
      },1000);
    }

    damage() {
      this.gCircle.animate({
        'stroke-width': 10,
        'stroke': '#990000'
      }, 200, () => {
        this.gCircle.animate({
          'stroke-width': 3,
          'stroke': '#fff'
        }, 1000);
      });

      this.gPower.animate({
        transform: UM().scale(1.5,1.5)
      }, 200, () => {
        this.gPower.animate({
          transform: UM()
        }, 200);
      });
    }

    _normalState() {}
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
      if (state.state === 'cooldown' || state.state === 'waiting') this.show();
      if (time < 10) {
        this.animate({
          transform: UM().scale(2, 2, CX, CY),
          fill: '#330000',
        }, 300, () => {
          if (time > 0) {
            this.animate({
              transform: UM(),
              fill: ''
            }, 100);
          } else {
            this.animate({
              transform: UM().scale(0, 0, CX, CY),
              fill: ''
            }, 10, () => {
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
      let args = Array.prototype.slice.call(arguments, 1);
      if (s !== this.state) this.leaveState(this.state);
      this.state = s;
      switch(s) {
        case 'welcome':
        showWelcome();
        break;
        // waiting start
        case 'waiting':
        io.send({type: 'game control', status: 'begin'});
        timer.show();
        panel.show();
        this.show('等待用户加入');
        break;
        case 'cooldown':
        this.text('请说出指令');
        round.nextRound();
        timer.show();
        break;
        case 'action':
        this.text('决战中...');
        People.do.apply(People, args.concat([() => {this.setState('waitcooldown'); }]));
        case 'waitcooldown':
        this.text('等待下一次开始');
        break;
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
    // state.setState('none');
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
    const text = paper.text(CX, 600, 'Power By XGHeaven,XANA,sino,JK');
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

  setTimeout(() => {
    // new People(2).reset().attach().setState('dead');
  }, 2000);

  window.shot = function shot(x1,y1,x2,y2,color=0,cb) {
    x1 = (x1 - CX) / -SPRITE; 
    y1 = (y1 - CY) / -SPRITE;
    x2 = (x2 - CX) / -SPRITE;
    y2 = (y2 - CY) / -SPRITE;
    if (typeof cb === 'function') {
      sprite({x:x1,y:y1}, {x:x2, y:y2}, color, 50, 1000, cb);
    } else {
      return new Promise((resolve, reject) => {
        sprite({x:x1,y:y1}, {x:x2, y:y2}, color, 50, 1000, resolve);
      });
    }
  }

  io.on('message', data => {
    // return;
    console.log('message', data);
    if (data.status === 'end') {
      if (state.state === 'action') {
        state.setState('end');
      }
    }
  });

  io.on('members', members => {
    // return;
    console.log('members', members);
    _.differenceWith(members, People.peoples, (a,b) => a.id === b.uid).forEach(people => {
      People.add(people.id, people.name);
    });

    state.setState('action', members);
  });

  io.on('time', time => {
    // return;
    console.log('time', time);
    timer.setTime(time.countDown);
    if (parseFloat(time.countDown) && state.state === 'waitcooldown') {
      state.setState('cooldown');
    }
  });

  if (INVERT) {
    s.attr({
      filter: s.filter(Snap.filter.invert())
    });
    document.body.style.backgroundColor = '#000';
  }
})()